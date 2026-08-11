/**
 * Turns a parsed spreadsheet/JSON row into the exact shape the catalogue
 * stores, without caring which tool exported it.
 *
 * Supplier files never agree on column names — the same field is `Variant
 * Price` in a Shopify export, `regular_price` in WooCommerce, `MRP` in an
 * Indian distributor's sheet and `Our Price` in someone's hand-kept workbook.
 * Rather than make the operator rename columns before every import, every known
 * spelling maps to one canonical field here, and anything unrecognised is
 * reported rather than silently dropped.
 */

import { normalizeHeader, type CsvRecord } from "./csv";

export interface ImportProduct {
  slug: string;
  /** Supplier identity. Present when the file has one; matched on before slug. */
  sku: string | null;
  title: string;
  price: number;
  originalPrice: number;
  totalStock: number;
  rating: number;
  numReviews: number;
  description: string;
  aboutFeatures: string[];
  idealFor: string[];
  specifications: { label: string; value: string }[];
  images: string[];
  videos: string[];
  /** Category/brand arrive as human names and are resolved to rows at write time. */
  category: string;
  subcategory: string;
  brand: string;
  isPublished: boolean;
  isFeatured: boolean;
  isDeal: boolean;
  /** Source line, kept so every error message can point at a row in their file. */
  line: number;
}

export interface RowIssue {
  line: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

/* ------------------------------------------------------------------ */
/* Column aliases                                                      */
/* ------------------------------------------------------------------ */

/**
 * Canonical field → every header spelling seen in the wild, pre-normalised
 * (lowercased, punctuation stripped) to match `normalizeHeader`.
 *
 * Order matters: the first alias present in the file wins, so the more specific
 * spelling is listed before the generic one.
 */
const ALIASES: Record<string, string[]> = {
  // Kept apart on purpose. `slug` is the public URL and should read like the
  // product; `sku` is the supplier's stable identity and is what a re-import
  // matches on. Folding SKUs into slugs would give every product a URL like
  // /product/wow-00417 and make a title edit look like a brand new product.
  slug: ["slug", "handle", "urlkey", "permalink", "seourl", "urlslug"],
  sku: ["sku", "itemcode", "productcode", "modelnumber", "mpn", "articlenumber", "code", "productid", "id"],
  title: ["title", "name", "productname", "producttitle", "itemname", "post_title"],
  price: ["price", "sellingprice", "saleprice", "specialprice", "offerprice", "ourprice", "variantprice", "regularprice", "unitprice"],
  originalPrice: ["originalprice", "mrp", "compareatprice", "variantcompareatprice", "listprice", "retailprice", "strikeprice", "maximumretailprice"],
  totalStock: ["totalstock", "stock", "quantity", "qty", "inventory", "inventoryquantity", "variantinventoryqty", "stockqty", "availablequantity", "instock"],
  description: ["description", "productdescription", "bodyhtml", "body", "longdescription", "details", "about", "post_content"],
  category: ["category", "categoryname", "producttype", "department", "maincategory", "productcategories", "categories"],
  subcategory: ["subcategory", "subcategoryname", "subdepartment", "childcategory", "secondarycategory", "type2"],
  brand: ["brand", "brandname", "vendor", "manufacturer", "make", "supplier"],
  images: ["images", "imageurls", "imagesrc", "imageurl", "image", "photos", "photo", "picture", "pictures", "thumbnail", "imagelink"],
  videos: ["videos", "videourls", "videourl", "video", "youtube", "videolink"],
  aboutFeatures: ["aboutfeatures", "features", "keyfeatures", "highlights", "bullets", "bulletpoints", "featurelist"],
  idealFor: ["idealfor", "suitablefor", "agegroup", "agerange", "usedfor", "tags"],
  specifications: ["specifications", "specs", "attributes", "technicaldetails", "additionalinformation"],
  rating: ["rating", "avgrating", "averagerating", "stars", "ratingvalue"],
  numReviews: ["numreviews", "reviews", "reviewcount", "ratingcount", "numberofreviews"],
  isPublished: ["ispublished", "published", "status", "active", "visible", "visibility", "enabled"],
  isFeatured: ["isfeatured", "featured"],
  isDeal: ["isdeal", "deal", "ondeal", "isoffer", "clearance"],
};

/** Which alias each canonical field resolved to, for this particular file. */
export type ColumnMap = Record<string, string | undefined>;

export function buildColumnMap(headers: string[]): ColumnMap {
  const present = new Set(headers);
  const map: ColumnMap = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    map[field] = aliases.find((alias) => present.has(alias));
  }
  return map;
}

/** Headers the importer will ignore — surfaced so a typo'd column is visible. */
export function unmappedHeaders(headers: string[], map: ColumnMap): string[] {
  const used = new Set(Object.values(map).filter(Boolean) as string[]);
  return headers.filter((h) => h && !used.has(h));
}

/* ------------------------------------------------------------------ */
/* Value coercion                                                      */
/* ------------------------------------------------------------------ */

/**
 * Reads a money/number cell.
 *
 * Handles currency symbols and both grouping conventions: `1,299.00` (en) and
 * `1.299,00` (de/es, which several EU supplier exports use). Whichever
 * separator appears last is the decimal point — that single rule distinguishes
 * the two without needing to know the locale.
 */
export function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const cleaned = text.replace(/[^\d.,-]/g, "");
  if (!cleaned || cleaned === "-") return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma === -1 && lastDot === -1) {
    normalized = cleaned;
  } else if (lastComma > lastDot) {
    // Comma is the decimal separator: strip dots (grouping), swap comma for dot.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = cleaned.replace(/,/g, "");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const TRUTHY = new Set(["1", "true", "yes", "y", "active", "published", "publish", "visible", "instock", "enabled", "on"]);
const FALSY = new Set(["0", "false", "no", "n", "draft", "hidden", "archived", "outofstock", "disabled", "off", "private"]);

export function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null) return fallback;
  const text = String(raw).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!text) return fallback;
  if (TRUTHY.has(text)) return true;
  if (FALSY.has(text)) return false;
  return fallback;
}

/**
 * Splits a multi-value cell.
 *
 * Pipe, semicolon and newline are always separators. Comma is only treated as
 * one when every resulting part looks like a URL — otherwise a description or a
 * feature sentence would be shredded at its punctuation.
 */
export function splitList(raw: string | undefined): string[] {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text) return [];

  let parts = text
    .split(/\s*[|;\n\r]+\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 1 && parts[0].includes(",")) {
    const commaParts = parts[0].split(",").map((p) => p.trim()).filter(Boolean);
    if (commaParts.length > 1 && commaParts.every((p) => /^https?:\/\//i.test(p))) {
      parts = commaParts;
    }
  }

  return parts;
}

/** `Remote: 2.4GHz | Top Speed: 60 km/h` → structured spec rows. */
export function parseSpecs(raw: string | undefined): { label: string; value: string }[] {
  return splitList(raw)
    .map((pair) => {
      const at = pair.indexOf(":");
      if (at === -1) return null;
      const label = pair.slice(0, at).trim();
      const value = pair.slice(at + 1).trim();
      return label && value ? { label, value } : null;
    })
    .filter((s): s is { label: string; value: string } => s !== null);
}

/** Shopify's `Body (HTML)` is real markup; the storefront renders plain text. */
export function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // Drop the combining marks NFKD just split off, so "Pokémon" → "pokemon"
    // rather than losing the whole letter to the non-Latin filter below.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ------------------------------------------------------------------ */
/* Row → product                                                       */
/* ------------------------------------------------------------------ */

export interface NormalizeOptions {
  /** Used when a row has no category column or leaves it blank. */
  defaultCategory?: string;
  defaultBrand?: string;
  /** Rows are published unless their file says otherwise. */
  defaultPublished?: boolean;
}

export interface NormalizeResult {
  products: ImportProduct[];
  issues: RowIssue[];
  columnMap: ColumnMap;
  unmapped: string[];
}

export function normalizeRecords(
  headers: string[],
  records: CsvRecord[],
  options: NormalizeOptions = {},
): NormalizeResult {
  const columnMap = buildColumnMap(headers);
  const issues: RowIssue[] = [];
  const products: ImportProduct[] = [];

  const {
    defaultCategory = "Uncategorised",
    defaultBrand = "Unbranded",
    defaultPublished = true,
  } = options;

  const get = (record: CsvRecord, field: string): string | undefined => {
    const column = columnMap[field];
    return column ? record.values[column] : undefined;
  };

  /** Slug → index in `products`, so a repeated slug merges instead of colliding. */
  const bySlug = new Map<string, number>();
  /** SKU → index, used to fold continuation rows back onto their parent. */
  const bySku = new Map<string, number>();

  for (const record of records) {
    const title = (get(record, "title") ?? "").trim();
    const rawSlug = (get(record, "slug") ?? "").trim();
    const sku = (get(record, "sku") ?? "").trim() || null;

    // Shopify and WooCommerce both emit continuation rows: the same handle or
    // SKU repeated with an empty title, carrying one extra image each. Fold
    // those into the product already built rather than rejecting them.
    if (!title) {
      const parentIndex =
        (rawSlug ? bySlug.get(slugify(rawSlug)) : undefined) ?? (sku ? bySku.get(sku) : undefined);

      if (parentIndex !== undefined) {
        const target = products[parentIndex];
        for (const url of splitList(get(record, "images"))) {
          if (!target.images.includes(url)) target.images.push(url);
        }
        continue;
      }

      issues.push({
        line: record.line,
        field: "title",
        message: "No product title — row skipped.",
        severity: "error",
      });
      continue;
    }

    const base = slugify(rawSlug || title);
    if (!base) {
      issues.push({
        line: record.line,
        field: "slug",
        message: `"${title}" produces an empty URL slug (no Latin characters) — row skipped.`,
        severity: "error",
      });
      continue;
    }

    let slug = base;
    if (bySlug.has(slug)) {
      // Two genuinely different products can share a title. Prefer the SKU as
      // the disambiguator: it's stable, so a re-import of the same file lands on
      // the same URLs. A positional "-2" would shuffle whenever row order did.
      const skuSuffix = sku ? slugify(sku) : "";
      const candidate = skuSuffix ? `${base}-${skuSuffix}` : "";

      if (candidate && !bySlug.has(candidate)) {
        slug = candidate;
      } else {
        let suffix = 2;
        slug = `${base}-${suffix}`;
        while (bySlug.has(slug)) slug = `${base}-${++suffix}`;
      }

      issues.push({
        line: record.line,
        field: "slug",
        message: `Slug "${base}" already used in this file — imported as "${slug}".`,
        severity: "warning",
      });
    }

    products.push(
      buildProduct(slug, sku, title, record, get, issues, defaultCategory, defaultBrand, defaultPublished),
    );
    bySlug.set(slug, products.length - 1);
    if (sku && !bySku.has(sku)) bySku.set(sku, products.length - 1);
  }

  return { products, issues, columnMap, unmapped: unmappedHeaders(headers, columnMap) };
}

function buildProduct(
  slug: string,
  sku: string | null,
  title: string,
  record: CsvRecord,
  get: (r: CsvRecord, f: string) => string | undefined,
  issues: RowIssue[],
  defaultCategory: string,
  defaultBrand: string,
  defaultPublished: boolean,
): ImportProduct {
  const price = parseNumber(get(record, "price"));
  const originalPrice = parseNumber(get(record, "originalPrice"));
  const stock = parseNumber(get(record, "totalStock"));
  const rating = parseNumber(get(record, "rating"));
  const numReviews = parseNumber(get(record, "numReviews"));

  if (price === null) {
    issues.push({
      line: record.line,
      field: "price",
      message: `"${title}" has no readable price — imported at 0, fix before publishing.`,
      severity: "warning",
    });
  }

  const finalPrice = Math.max(0, Math.round(price ?? 0));
  // A missing or lower "original" price would render a negative discount badge.
  const finalOriginal = Math.max(finalPrice, Math.round(originalPrice ?? 0));

  const rawImages = splitList(get(record, "images"));
  const images = rawImages.filter((url) => /^https?:\/\//i.test(url) || url.startsWith("/"));
  if (rawImages.length !== images.length) {
    issues.push({
      line: record.line,
      field: "images",
      message: `"${title}": ${rawImages.length - images.length} image value(s) aren't usable URLs and were dropped.`,
      severity: "warning",
    });
  }
  if (!images.length) {
    issues.push({
      line: record.line,
      field: "images",
      message: `"${title}" has no image — it will render with an empty tile.`,
      severity: "warning",
    });
  }

  const descriptionRaw = (get(record, "description") ?? "").trim();

  return {
    slug,
    sku,
    title,
    price: finalPrice,
    originalPrice: finalOriginal,
    totalStock: Math.max(0, Math.round(stock ?? 0)),
    // A 0–5 star scale: anything outside it is a mis-mapped column, not a rating.
    rating: rating !== null && rating >= 0 && rating <= 5 ? Number(rating.toFixed(2)) : 0,
    numReviews: Math.max(0, Math.round(numReviews ?? 0)),
    description: descriptionRaw.includes("<") ? stripHtml(descriptionRaw) : descriptionRaw,
    aboutFeatures: splitList(get(record, "aboutFeatures")),
    idealFor: splitList(get(record, "idealFor")),
    specifications: parseSpecs(get(record, "specifications")),
    images,
    videos: splitList(get(record, "videos")).filter((url) => /^https?:\/\//i.test(url)),
    category: (get(record, "category") ?? "").trim() || defaultCategory,
    subcategory: (get(record, "subcategory") ?? "").trim(),
    brand: (get(record, "brand") ?? "").trim() || defaultBrand,
    isPublished: parseBool(get(record, "isPublished"), defaultPublished),
    isFeatured: parseBool(get(record, "isFeatured"), false),
    isDeal: parseBool(get(record, "isDeal"), false),
    line: record.line,
  };
}

/**
 * JSON feeds get the same treatment as CSV: flatten each object into
 * header/value pairs and reuse the whole alias and coercion path, so the two
 * formats can't drift apart in what they accept.
 */
export function recordsFromJson(input: unknown): { headers: string[]; records: CsvRecord[] } {
  const array = Array.isArray(input)
    ? input
    : Array.isArray((input as { products?: unknown })?.products)
      ? (input as { products: unknown[] }).products
      : Array.isArray((input as { data?: unknown })?.data)
        ? (input as { data: unknown[] }).data
        : null;

  if (!array) return { headers: [], records: [] };

  const headerSet = new Set<string>();
  const records: CsvRecord[] = array.map((item, index) => {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries((item ?? {}) as Record<string, unknown>)) {
      const normalized = normalizeHeader(key);
      if (!normalized) continue;
      headerSet.add(normalized);
      values[normalized] = Array.isArray(value)
        ? value.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v))).join(" | ")
        : value === null || value === undefined
          ? ""
          : typeof value === "object"
            ? Object.entries(value as Record<string, unknown>)
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join(" | ")
            : String(value);
    }
    // JSON has no line numbers; the array index is the equivalent anchor.
    return { line: index + 1, values };
  });

  return { headers: [...headerSet], records };
}
