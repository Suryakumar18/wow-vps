import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { catalog } from "../app/components-home/data/catalog";
import { coupons } from "../app/components-home/data/home-content";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categoryNames: Record<string, string> = {
  "rc-cars": "RC Cars & Vehicles",
  "toy-drones": "Toy Drones & Helicopters",
  "toys-games": "Toys & Games",
  "building-sets": "Building Sets & Blocks",
  "hobby-models": "Hobby & Scale Models",
  "action-figures": "Action Figures & Playsets",
  "sports-outdoors": "Sports & Outdoors",
  "soft-toys": "Soft Toys & Plush",
};

async function main() {
  const categoryIdBySlug = new Map<string, string>();
  for (const [slug, name] of Object.entries(categoryNames)) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    categoryIdBySlug.set(slug, category.id);
  }

  const brandIdByName = new Map<string, string>();
  const brandNames = [...new Set(catalog.map((product) => product.brand))];
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    brandIdByName.set(name, brand.id);
  }

  for (const product of catalog) {
    const categoryId = categoryIdBySlug.get(product.categoryId);
    const brandId = brandIdByName.get(product.brand);
    if (!categoryId || !brandId) {
      throw new Error(`Seed data references unknown category/brand for product "${product.id}"`);
    }

    await prisma.product.upsert({
      where: { slug: product.id },
      update: {
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        totalStock: product.totalStock,
        rating: product.rating,
        numReviews: product.numReviews,
        description: product.description,
        aboutFeatures: product.aboutFeatures,
        idealFor: product.idealFor,
        brandId,
        categoryId,
      },
      create: {
        slug: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        totalStock: product.totalStock,
        rating: product.rating,
        numReviews: product.numReviews,
        description: product.description,
        aboutFeatures: product.aboutFeatures,
        idealFor: product.idealFor,
        brandId,
        categoryId,
        images: {
          create: product.images.map((url, position) => ({ url, position })),
        },
        specifications: {
          create: product.specifications.map((spec, position) => ({
            label: spec.label,
            value: spec.value,
            position,
          })),
        },
      },
    });
  }

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { percentOff: coupon.percentOff, minOrder: coupon.minOrder },
      create: { code: coupon.code, percentOff: coupon.percentOff, minOrder: coupon.minOrder },
    });
  }

  // Ensures an admin account exists on a fresh database. Never overwrites the
  // password of one that already exists — re-running the seed must not
  // silently invalidate credentials already handed to someone.
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@wowlifestyle.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    if (!existingAdmin.isAdmin) {
      await prisma.user.update({ where: { id: existingAdmin.id }, data: { isAdmin: true } });
    }
    console.log(`Admin account already exists: ${adminEmail}`);
  } else {
    const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, name: "Admin", passwordHash, isAdmin: true },
    });
    console.log(`Created admin account: ${adminEmail} / ${adminPassword} — sign in and change this password.`);
  }

  console.log(`Seeded ${categoryIdBySlug.size} categories, ${brandIdByName.size} brands, ${catalog.length} products, ${coupons.length} coupons.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
