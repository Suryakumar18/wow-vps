# Container image for the WOW Lifestyle storefront.
#
# Only needed if you deploy somewhere that takes a container — the Hostinger
# VPS, Fly, Railway, a Kubernetes cluster. Vercel builds straight from the repo
# and ignores this file entirely.
#
# Three stages so the shipped image carries neither the source nor the build
# toolchain: it ends up with the Next standalone server and the node_modules
# that server actually traced, and nothing else.

# ---------------------------------------------------------------------------
# 1. Dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Prisma's engines need this on Alpine.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# `npm ci` runs the postinstall `prisma generate`, which needs the schema —
# hence copying prisma/ before installing. It doesn't need a live database.
RUN npm ci

# ---------------------------------------------------------------------------
# 2. Build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The generated Prisma client lives in app/generated/prisma and is gitignored,
# so regenerate it against the copied source tree.
RUN npx prisma generate

# BUILD_STANDALONE makes next.config.ts emit .next/standalone.
#
# DATABASE_URL is a placeholder: `next build` prerenders the homepage, which
# reads the CMS tables. The read fails, `withFallback` serves the approved
# static copy, and the page regenerates against the real database on first
# request (it's ISR with a 1h window). Baking a real credential into an image
# layer would be worse than a stale first paint.
ENV BUILD_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV ADMIN_AUTH_SECRET="build-time-placeholder-not-used-at-runtime-0000"
RUN npm run build

# ---------------------------------------------------------------------------
# 3. Runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Must bind 0.0.0.0, not localhost, or nothing outside the container can reach it.
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# The standalone output already contains the traced node_modules and server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations, so the container can run `npx prisma migrate deploy` on release.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# /api/health does a real `SELECT 1`, so an unreachable database marks the
# container unhealthy instead of it sitting there serving 500s.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
