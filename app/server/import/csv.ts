/**
 * CSV reading for the bulk product importer.
 *
 * Hand-written rather than pulled in as a dependency: a supplier spreadsheet is
 * the one input this app accepts from outside itself, and a parser we can read
 * end to end is worth more here than another package in the tree. Handles
 * everything Excel's "Save as CSV" and the Shopify/WooCommerce exporters
 * actually emit: quoted fields, doubled quotes, embedded commas and newlines,
 * CR / LF / CRLF line endings, and a UTF-8 BOM.
 */

/** A single parsed row, still positional — headers are applied by `toRecords`. */
export type CsvRow = string[];

export function parseCsv(input: string, delimiter = ","): CsvRow[] {
  // Excel prefixes UTF-8 CSVs with a BOM. Left in place it becomes part of the
  // first header's name, and every lookup for that column silently misses.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: CsvRow[] = [];
  let row: CsvRow = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    // A quote only opens a quoted field at the field's start; anywhere else
    // it's just a character (`12" ruler`).
    if (ch === '"' && field === "") {
      quoted = true;
      i++;
      continue;
    }
    if (ch === delimiter) {
      endField();
      i++;
      continue;
    }
    if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
      i++;
      continue;
    }
    if (ch === "\n") {
      endRow();
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // A file not ending in a newline still has a final row to flush; one that
  // does must not gain a phantom empty row.
  if (field !== "" || row.length) endRow();
  return rows;
}

/**
 * Guesses the delimiter from the header line.
 *
 * Locales that use a comma as the decimal separator make Excel write
 * semicolon-delimited CSVs, and those are common enough in supplier exports
 * that silently parsing one as a single-column file is a real failure mode.
 */
export function detectDelimiter(input: string): string {
  const firstLine = input.slice(0, 4000).split(/\r?\n/)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    // Count only outside quotes, so a description containing commas can't win.
    let count = 0;
    let quoted = false;
    for (let i = 0; i < firstLine.length; i++) {
      const ch = firstLine[i];
      if (ch === '"') quoted = !quoted;
      else if (!quoted && ch === d) count++;
    }
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/** Header text → a stable key: case, spaces and punctuation all ignored. */
export const normalizeHeader = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");

export interface CsvRecord {
  /** 1-based line number in the source file, for error messages. */
  line: number;
  values: Record<string, string>;
}

/**
 * Applies the header row to the remaining rows.
 *
 * Fully blank rows are dropped — trailing newlines and the spacer rows people
 * leave in spreadsheets would otherwise each become a row that fails
 * validation for no useful reason.
 */
export function toRecords(rows: CsvRow[]): { headers: string[]; records: CsvRecord[] } {
  if (!rows.length) return { headers: [], records: [] };

  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) => normalizeHeader(h.trim()));
  const records: CsvRecord[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.every((cell) => cell.trim() === "")) continue;

    const values: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      // First column wins when a sheet repeats a header name — the duplicate is
      // almost always an empty spacer column.
      if (values[key] === undefined) values[key] = (row[c] ?? "").trim();
    }
    records.push({ line: r + 1, values });
  }

  return { headers, records };
}

/** Parses a whole CSV file in one call, delimiter sniffing included. */
export function readCsv(input: string) {
  return toRecords(parseCsv(input, detectDelimiter(input)));
}
