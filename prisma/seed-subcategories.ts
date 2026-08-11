import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Seeds a starter set of subcategories per department.
 *
 * Taken from the labels the old mega menu already showed, so the navigation
 * keeps the same vocabulary — but as real rows that link somewhere, replacing
 * the 41 placeholder links that all pointed at "/".
 */
const SUBCATEGORIES: Record<string, string[]> = {
  "rc-cars": ["Monster Trucks", "Drift Cars", "Buggies", "Rock Crawlers", "Touring Cars"],
  "toy-drones": ["Beginner Drones", "Camera Drones", "Mini & Pocket", "Stunt Drones", "Helicopters"],
  "toys-games": ["Board Games", "Card Games", "Puzzles", "Brain Teasers", "Outdoor Play"],
  "building-sets": ["City Sets", "Vehicles", "Modular Buildings", "Starter Bricks"],
  "hobby-models": ["Ship Models", "Aircraft Kits", "Diecast Cars", "Paints & Tools"],
  "action-figures": ["Superheroes", "Playsets", "Collectible Figures"],
  "sports-outdoors": ["Footballs", "Racquet Sports", "Garden Games"],
  "soft-toys": ["Teddy Bears", "Plush Animals", "Nursery"],
};

const slugify = (v: string) =>
  v.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  let created = 0;
  for (const [categorySlug, names] of Object.entries(SUBCATEGORIES)) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      console.warn(`skipping ${categorySlug} — no such category`);
      continue;
    }
    for (const [position, name] of names.entries()) {
      const slug = slugify(name);
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug } },
        update: { name, position },
        create: { categoryId: category.id, slug, name, position },
      });
      created += 1;
    }
  }
  console.log(`Seeded ${created} subcategories across ${Object.keys(SUBCATEGORIES).length} departments.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
