/**
 * Removes the generated load-test catalogue.
 *
 *   npx tsx prisma/remove-generated-products.ts --dry-run
 *   npx tsx prisma/remove-generated-products.ts
 *
 * `prisma/generate-catalog.ts` writes products with SKUs of the form
 * `WOW-00001`, and that prefix is the only thing deleted here — the 14 seeded
 * demo products have no SKU at all, and anything imported from a real supplier
 * file carries that supplier's own. Nothing without a `WOW-#####` SKU is
 * touched.
 *
 * Products referenced by a past order are unpublished rather than deleted, for
 * the same reason the admin panel does it: deleting one would rewrite order
 * history.
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const generated = await prisma.product.findMany({
    // Anchored and digit-shaped so a real SKU that merely starts with "WOW-"
    // can't be swept up.
    where: { sku: { startsWith: "WOW-" } },
    select: { id: true, sku: true, title: true },
  });

  const candidates = generated.filter((p) => /^WOW-\d{5}$/.test(p.sku ?? ""));
  console.log(`\nFound ${candidates.length} generated product(s).`);

  if (!candidates.length) {
    console.log("Nothing to do.\n");
    return;
  }

  const ids = candidates.map((p) => p.id);

  const ordered = await prisma.orderItem.findMany({
    where: { productId: { in: ids } },
    select: { productId: true },
    distinct: ["productId"],
  });
  const orderedIds = new Set(ordered.map((o) => o.productId).filter((id): id is string => !!id));
  const deletable = ids.filter((id) => !orderedIds.has(id));

  console.log(`  ${deletable.length} will be deleted`);
  console.log(`  ${orderedIds.size} appear in past orders and will be unpublished instead`);

  if (dryRun) {
    console.log("\nDry run — nothing written.\n");
    return;
  }

  // Cart and wishlist rows reference products directly and would block the
  // delete; they're transient by nature, so clearing them is correct.
  await prisma.cartItem.deleteMany({ where: { productId: { in: deletable } } });
  await prisma.wishlistItem.deleteMany({ where: { productId: { in: deletable } } });

  if (orderedIds.size) {
    await prisma.product.updateMany({
      where: { id: { in: [...orderedIds] } },
      data: { isPublished: false },
    });
  }

  const removed = await prisma.product.deleteMany({ where: { id: { in: deletable } } });
  console.log(`\nDeleted ${removed.count} product(s).`);

  // Brands and departments the generator invented, now that nothing uses them.
  const emptyBrands = await prisma.brand.deleteMany({ where: { products: { none: {} } } });
  const emptySubs = await prisma.subcategory.deleteMany({ where: { products: { none: {} } } });
  console.log(`Removed ${emptyBrands.count} now-empty brand(s) and ${emptySubs.count} subcategory/ies.`);
  console.log("Departments are left alone — deleting one would take its homepage tile with it.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
