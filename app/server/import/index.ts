/**
 * One entry point for bulk product import, shared by the admin screen and the
 * CLI so the two can't drift in what they accept.
 *
 * Takes a Prisma client as an argument rather than importing the shared one:
 * `app/server/prisma.ts` is marked `server-only`, which makes it unimportable
 * from a `tsx` script, and the CLI needs the same code path the admin UI uses.
 */

import { readCsv } from "./csv";
import { normalizeRecords, recordsFromJson, type NormalizeOptions } from "./normalize";
import { runImport, type ImportOptions, type ImportReport } from "./run";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { ColumnMap } from "./normalize";

export * from "./csv";
export * from "./normalize";
export * from "./run";

export interface ImportOutcome {
  report: ImportReport;
  /** Which column of their file each catalogue field was read from. */
  columnMap: ColumnMap;
  /** Columns the importer didn't recognise — usually a typo or a real gap. */
  unmapped: string[];
  headers: string[];
  format: "csv" | "json";
}

function looksLikeJson(text: string) {
  const head = text.trimStart()[0];
  return head === "[" || head === "{";
}

/** Parses and validates without touching the database. */
export function prepareImport(
  text: string,
  filename = "",
  options: NormalizeOptions = {},
) {
  const format: "csv" | "json" =
    filename.toLowerCase().endsWith(".json") || looksLikeJson(text) ? "json" : "csv";

  const { headers, records } =
    format === "json" ? recordsFromJson(JSON.parse(text)) : readCsv(text);

  return { format, headers, records, ...normalizeRecords(headers, records, options) };
}

export async function importProducts(
  prisma: PrismaClient,
  text: string,
  filename = "",
  options: NormalizeOptions & ImportOptions = {},
): Promise<ImportOutcome> {
  const { format, headers, products, issues, columnMap, unmapped } = prepareImport(
    text,
    filename,
    options,
  );
  const report = await runImport(prisma, products, issues, options);
  return { report, columnMap, unmapped, headers, format };
}
