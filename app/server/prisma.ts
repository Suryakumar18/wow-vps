import "server-only";
// Imported for its side effect: the environment check runs at module load, and
// virtually every server path reaches the database, so a deploy missing a
// required variable fails at boot with a clear message rather than at the first
// login attempt.
import "./env";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * The shared Prisma client.
 *
 * Next.js dev hot-reload re-evaluates this module on every edit; without
 * caching the instance on `globalThis`, each reload opens a fresh pool of
 * connections against the Supabase pooler until it's exhausted.
 *
 * The cached instance is keyed on the generated `PrismaClient` class it was
 * built from. `prisma generate` emits a new class, and an instance built from
 * the previous one throws "Unknown field …" for every newly added model until
 * the dev server is restarted — the class check makes that self-healing: a
 * regenerated client is detected on the next hot reload and a fresh instance
 * replaces the stale one, while ordinary edits still reuse the same pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientClass?: unknown;
};

const isStale =
  globalForPrisma.prisma !== undefined && globalForPrisma.prismaClientClass !== PrismaClient;

if (isStale) {
  // Release the old pool rather than leaking it for the life of the process.
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
}

export const prisma =
  (isStale ? undefined : globalForPrisma.prisma) ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClientClass = PrismaClient;
}
