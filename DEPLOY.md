# Deploying WOWLifestyle

Everything below has been exercised against a real 3,000-product catalogue on
this codebase. Where something is *not* yet verified, it says so.

---

## 1. Environment variables

The app refuses to boot without these (`app/server/env.ts` checks at startup, so
a misconfigured deploy fails immediately with a message instead of 500ing on the
first login).

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | **yes** | Postgres connection. Currently the Supabase pooler. |
| `DIRECT_URL` | for migrations | Unpooled connection, used by `prisma migrate`. |
| `ADMIN_AUTH_SECRET` | **yes at runtime** | Signs *every* session cookie, customer and admin alike — the name is historical. Must be ≥32 characters in production. Generate with `openssl rand -base64 48`. |
| `NEXT_PUBLIC_APP_URL` | strongly recommended | The public origin. Drives canonical tags, OpenGraph URLs, `sitemap.xml` and `robots.txt`. Without it these point at a fallback. |
| `IMAGE_HOSTS` | as needed | Comma-separated extra image hosts, e.g. `cdn.example.com,https://res.cloudinary.com`. Bare hostnames are assumed HTTPS. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first deploy only | Seeds the initial admin. Change the password after first login. |
| `VPS_SSH_HOST` / `VPS_SSH_USER` / `VPS_SSH_PASSWORD` | only for admin uploads | SFTP target for the admin Media Uploader. Without them uploads return 503; nothing else is affected. |
| `GOOGLE_SITE_VERIFICATION` | optional | Search Console meta tag. |

**Rotating `ADMIN_AUTH_SECRET` logs everyone out.** That's the correct behaviour,
but do it deliberately, not as part of a routine deploy.

---

## 2. First deploy

```bash
npm ci                       # postinstall runs `prisma generate`
npm run db:migrate           # applies prisma/migrations — never `migrate dev` in production
npm run seed                 # only on an empty database: catalogue, subcategories, CMS content
npm run build
npm start
```

`npm run seed` is idempotent but it writes the 14 demo products and the approved
homepage copy. On a database that already has real data, run only
`npm run seed:content` if the CMS tables are empty, and skip the rest.

Create an admin without seeding:

```bash
npm run admin:create -- you@example.com 'a-strong-password' 'Your Name'
```

---

## 3. Loading the 3,000 products

Two routes into the same code path, so they can't disagree.

**Admin UI** — `/admin/import`. Drop in a CSV or JSON export. It shows which of
your columns it understood before writing anything, offers a dry run, and
uploads in slices with a real progress bar. This is the one to hand to a
non-developer.

**CLI** — for large files, or when you want the full error list:

```bash
npm run products:import -- catalog.csv --dry-run
npm run products:import -- catalog.csv
```

Options: `--dry-run`, `--skip-existing`, `--batch <n>`, `--category <name>`,
`--brand <name>`, `--unpublished`.

### What the importer handles

- **Any column naming.** Shopify (`Handle`, `Variant Price`, `Body (HTML)`),
  WooCommerce, and ordinary distributor spreadsheets (`MRP`, `Qty`, `Vendor`)
  all map automatically. Unrecognised columns are *reported*, never silently
  dropped — if a field you need shows up under "Columns ignored", add its
  spelling to `ALIASES` in `app/server/import/normalize.ts`.
- **Messy values.** `₹1,299.00` and `1.299,00` both parse. Pipe-, semicolon- and
  newline-separated image lists. HTML descriptions are stripped to text.
- **Missing departments and brands** are created as needed. New departments are
  created *hidden* from the homepage and the main nav, so an import can't
  silently reshape the storefront — give them artwork and enable them under
  Categories.
- **Re-imports converge.** Products are matched on `sku` first, then slug, so
  re-running a price list after someone edited a title updates the existing row
  instead of creating a second copy of the catalogue. Verified: a second run of
  the same 3,000-row file produced 0 created, 3,000 updated.
- **Interruptions are safe.** Every step is idempotent; a run that dies partway
  is fixed by running the same file again.

Measured on this machine against the Supabase pooler: 3,000 products in **12.4 s**
(first import), 33 s (full update pass).

To generate a realistic test file:

```bash
npm run products:generate -- 3000 --out catalog-3000.csv
```

### ⚠ The database currently holds 3,000 generated test products

They were imported to measure and verify the site at real scale. They're
harmless — every one has a `WOW-#####` SKU — but they are **not** your
catalogue. Remove them before or after importing the real 3,000:

```bash
npm run products:remove-generated -- --dry-run
```

```bash
npm run products:remove-generated
```

Only products whose SKU matches `WOW-` followed by exactly five digits are
touched. The 14 original demo products have no SKU and are left alone; anything
imported from a real supplier file carries that supplier's SKU and is left
alone. Products referenced by a past order are unpublished rather than deleted,
so order history stays intact.

---

## 4. Choosing a host

### Vercel (recommended for this app)

Zero configuration beyond environment variables. It handles the image CDN, edge
caching for the prerendered homepage, and ISR. Set the variables from §1 in
project settings, point it at the repo, done.

Two things to watch:

- Set `NEXT_PUBLIC_APP_URL` to the **production** domain. Preview deployments
  detect themselves via `VERCEL_ENV` and serve a `Disallow: /` robots.txt, so a
  preview copy of 3,000 products won't get indexed.
- Run `npm run db:migrate` as part of the release, not the build — Vercel builds
  can run concurrently and two migrations racing is not worth debugging.

### Container (Hostinger VPS, Fly, Railway, Kubernetes)

A `Dockerfile` is included. It builds the Next standalone output, so the runtime
image carries neither source nor toolchain.

```bash
docker build -t wowlifestyle .
docker run -p 3000:3000 --env-file .env wowlifestyle
```

Run migrations on release: `docker run --env-file .env wowlifestyle npx prisma migrate deploy`.

Put nginx or Caddy in front for TLS. The container binds `0.0.0.0` and exposes
`/api/health`, which does a real `SELECT 1` — so an unreachable database marks
the container unhealthy rather than leaving it serving errors.

**Not yet verified:** the Docker image has not been built or run in this
environment. Build it once before relying on it.

---

## 5. Images

Currently `next.config.ts` allows `images.unsplash.com` (the seeded catalogue)
and `http://200.97.164.140` (the VPS uploads directory).

**The VPS entry is a problem to fix before launch.** It's plain HTTP from a bare
IP address, which means:

- Once the storefront is on HTTPS, browsers will block those images as mixed
  content.
- There's no CDN in front of them, so every product photo is served from one
  box in one location.

Either put the VPS behind a domain with TLS and caching headers, or move product
imagery to a CDN (Cloudinary, ImageKit, S3+CloudFront, Supabase Storage) and add
the host via `IMAGE_HOSTS`. Nothing in the code needs to change for the second
option.

---

## 6. What was verified, and how

Against a live 3,000-product catalogue, production build:

| | Result |
|---|---|
| `tsc --noEmit` | clean |
| `next build` | clean, 52 pages |
| Storefront behaviour | 21/21 automated checks (sorting, paging, filters, facets, search, 404s, sitemap, auth) |
| Admin panel | 16/16 checks across every screen, authenticated |
| Homepage | 20 ms (prerendered, ISR 1 h) |
| Department listing | ~250 ms server-rendered, 35 KB on the wire |
| Product page | ~350 ms server-rendered, 28 KB on the wire |
| Catalogue API | 124–180 ms per query |

Roughly 60 ms of every API number above is round-trip latency to Supabase in
`ap-southeast-1` from this machine. Deployed in the same region, they land far
lower — the database work itself is single-digit milliseconds.

### Not verified

- The Docker image (built config only, never run here).
- SFTP media upload — `VPS_SSH_PASSWORD` is set but no upload was attempted, so
  the credential's validity is still unconfirmed.
- Payment: there is none, by design. Checkout says so in its own copy.

---

## 7. Known gaps that predate this work

Carried over from `HANDOFF.md`, still true:

1. **Account ↔ session linking is unbuilt.** Cart, wishlist, addresses and
   orders are keyed only on the anonymous `wow_session` cookie, never on
   `userId`. Logging in does not attach an existing cart or past orders to the
   account. This is the largest remaining functional hole and it touches money.
2. `app/components-home/lib/addresses.ts` always prepends two static demo
   addresses ahead of real rows, by design.
3. No payment gateway.
