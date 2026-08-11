/**
 * Bulk product import from the command line.
 *
 *   npx tsx prisma/import-products.ts <file.csv|file.json> [options]
 *
 *   --dry-run          Parse, validate and report. Writes nothing.
 *   --skip-existing    Leave products whose slug already exists untouched.
 *                      (Default is to update them from the file.)
 *   --batch <n>        Rows per round trip (default 200).
 *   --category <name>  Category for rows that don't specify one.
 *   --brand <name>     Brand for rows that don't specify one.
 *   --unpublished      Import as drafts instead of live products.
 *
 * Always dry-run a supplier file first: the report names every column the
 * importer could and couldn't read, which is the fastest way to catch a sheet
 * whose price ended up in a column nobody mapped.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { importProducts } from "../app/server/import";

const argv = process.argv.slice(2);

/** Flags that consume the next argument, so it isn't mistaken for the filename. */
const VALUE_FLAGS = new Set(["batch", "category", "brand"]);

function flag(name: string) {
  return argv.includes(`--${name}`);
}
function option(name: string) {
  const at = argv.indexOf(`--${name}`);
  return at !== -1 ? argv[at + 1] : undefined;
}

let file: string | undefined;
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg.startsWith("--")) {
    if (VALUE_FLAGS.has(arg.slice(2))) i++;
    continue;
  }
  file = arg;
  break;
}

if (!file) {
  console.error("Usage: npx tsx prisma/import-products.ts <file.csv|file.json> [--dry-run] [--skip-existing]");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const bar = (done: number, total: number) => {
  const width = 28;
  const filled = Math.round((done / total) * width);
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}] ${done}/${total}`;
};

async function main() {
  const dryRun = flag("dry-run");
  const text = readFileSync(file!, "utf8");

  console.log(`\nReading ${file}${dryRun ? "  (dry run — nothing will be written)" : ""}\n`);

  let lastLogged = 0;
  const outcome = await importProducts(prisma, text, file!, {
    dryRun,
    onConflict: flag("skip-existing") ? "skip" : "update",
    batchSize: Number(option("batch")) || 200,
    defaultCategory: option("category") ?? "Uncategorised",
    defaultBrand: option("brand") ?? "Unbranded",
    defaultPublished: !flag("unpublished"),
    onProgress: (done, total) => {
      // Rewriting every batch is noisy in a CI log; throttle to ~2% steps.
      if (done - lastLogged < total / 50 && done !== total) return;
      lastLogged = done;
      process.stdout.write(`\r  ${bar(done, total)}`);
    },
  });

  const { report, columnMap, unmapped, format, headers } = outcome;
  process.stdout.write("\n\n");

  console.log(`Format detected: ${format}  ·  ${headers.length} columns`);
  const mapped = Object.entries(columnMap).filter(([, col]) => col);
  console.log(`\nColumns read (${mapped.length}):`);
  for (const [field, col] of mapped) console.log(`  ${field.padEnd(16)} ← ${col}`);
  if (unmapped.length) {
    console.log(`\nColumns ignored (${unmapped.length}): ${unmapped.join(", ")}`);
    console.log("  If a field you need is in that list, add its spelling to ALIASES in app/server/import/normalize.ts");
  }

  const errors = report.issues.filter((i) => i.severity === "error");
  const warnings = report.issues.filter((i) => i.severity === "warning");

  console.log(`\n${"─".repeat(60)}`);
  console.log(dryRun ? "DRY RUN — would have:" : "Result:");
  console.log(`  created   ${report.created}`);
  console.log(`  updated   ${report.updated}`);
  console.log(`  skipped   ${report.skipped}`);
  console.log(`  rows in   ${report.total}`);
  if (report.categoriesCreated.length)
    console.log(`  new categories    ${report.categoriesCreated.join(", ")}`);
  if (report.subcategoriesCreated.length)
    console.log(`  new subcategories ${report.subcategoriesCreated.length}`);
  if (report.brandsCreated.length)
    console.log(`  new brands        ${report.brandsCreated.length}`);
  console.log(`  took      ${(report.durationMs / 1000).toFixed(1)}s`);

  if (errors.length) {
    console.log(`\n${errors.length} error(s) — these rows were not imported:`);
    for (const issue of errors.slice(0, 25)) console.log(`  line ${issue.line}: ${issue.message}`);
    if (errors.length > 25) console.log(`  … and ${errors.length - 25} more`);
  }
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const issue of warnings.slice(0, 15)) console.log(`  line ${issue.line}: ${issue.message}`);
    if (warnings.length > 15) console.log(`  … and ${warnings.length - 15} more`);
  }
  console.log("");
}

main()
  .catch((err) => {
    console.error("\nImport failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
