import "dotenv/config";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Creates (or promotes) an admin user. Run with:
 *   npx tsx prisma/create-admin.ts [email] [password] [name]
 * Any argument left out gets a sensible default / random value, printed at
 * the end — this is the only place the plaintext password ever appears.
 */
async function main() {
  const [, , emailArg, passwordArg, nameArg] = process.argv;

  const email = emailArg ?? "admin@wowlifestyle.com";
  const password = passwordArg ?? randomBytes(9).toString("base64url");
  const name = nameArg ?? "Admin";

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, passwordHash },
    create: { email, name, passwordHash, isAdmin: true },
  });

  console.log("Admin ready:");
  console.log(`  email:    ${user.email}`);
  console.log(`  password: ${password}`);
  console.log("(store this password now — it isn't recoverable, only re-settable by running this script again)");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
