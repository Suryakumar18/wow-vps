"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Info, Loader2, Upload } from "lucide-react";

import Button from "@/app/components-home/ui/Button";
import { readCsv } from "@/app/server/import/csv";
import {
  normalizeRecords,
  recordsFromJson,
  type ColumnMap,
  type ImportProduct,
  type RowIssue,
} from "@/app/server/import/normalize";
import type { ImportReport } from "@/app/server/import/run";
import { cn } from "@/app/components-home/lib/cn";

/**
 * Bulk product import.
 *
 * Parsing and validation happen here, in the browser, against the same modules
 * the CLI uses — so a 3,000-row file is checked before a single byte reaches
 * the database, and the operator sees exactly which of their columns were
 * understood. Only the normalised rows are uploaded, in slices, which keeps
 * each request well inside a serverless timeout and makes the progress bar real
 * rather than decorative.
 */

const CHUNK_SIZE = 250;

interface Prepared {
  filename: string;
  products: ImportProduct[];
  issues: RowIssue[];
  columnMap: ColumnMap;
  unmapped: string[];
  headers: string[];
  format: "csv" | "json";
}

type Phase = "idle" | "reading" | "ready" | "running" | "done";

const EMPTY_REPORT = (): ImportReport => ({
  total: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  categoriesCreated: [],
  subcategoriesCreated: [],
  brandsCreated: [],
  issues: [],
  durationMs: 0,
  dryRun: false,
});

export default function ImportClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [onConflict, setOnConflict] = useState<"skip" | "update">("update");
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setPhase("reading");
    setError(null);
    setReport(null);
    setProgress(0);

    try {
      const text = await file.text();
      const isJson = file.name.toLowerCase().endsWith(".json") || /^\s*[[{]/.test(text);

      const { headers, records } = isJson
        ? recordsFromJson(JSON.parse(text))
        : readCsv(text);

      if (!records.length) {
        setError("No data rows found. Check the file has a header row and at least one product.");
        setPhase("idle");
        return;
      }

      const { products, issues, columnMap, unmapped } = normalizeRecords(headers, records);

      setPrepared({
        filename: file.name,
        products,
        issues,
        columnMap,
        unmapped,
        headers,
        format: isJson ? "json" : "csv",
      });
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
      setPhase("idle");
    }
  }

  async function run(dryRun: boolean) {
    if (!prepared) return;
    setPhase("running");
    setError(null);
    setProgress(0);

    const totals = EMPTY_REPORT();
    totals.dryRun = dryRun;
    totals.total = prepared.products.length;
    // Parse-time issues belong to the whole file, not to any one slice.
    totals.issues = [...prepared.issues];

    const started = performance.now();

    for (let i = 0; i < prepared.products.length; i += CHUNK_SIZE) {
      const slice = prepared.products.slice(i, i + CHUNK_SIZE);

      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: slice, onConflict, dryRun }),
      });

      if (!res.ok) {
        const detail = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          `Stopped at row ${i + 1}: ${detail?.error ?? res.statusText}. ` +
            "Rows before this point were written; fix the problem and re-run the same file to continue.",
        );
        totals.durationMs = performance.now() - started;
        setReport(totals);
        setPhase("done");
        return;
      }

      const chunkReport = (await res.json()) as ImportReport;
      totals.created += chunkReport.created;
      totals.updated += chunkReport.updated;
      totals.skipped += chunkReport.skipped;
      totals.failed += chunkReport.failed;
      totals.categoriesCreated.push(...chunkReport.categoriesCreated);
      totals.subcategoriesCreated.push(...chunkReport.subcategoriesCreated);
      totals.brandsCreated.push(...chunkReport.brandsCreated);
      totals.issues.push(...chunkReport.issues);

      setProgress(Math.min(i + CHUNK_SIZE, prepared.products.length));
    }

    totals.durationMs = performance.now() - started;
    setReport(totals);
    setPhase("done");
  }

  const errors = (report?.issues ?? prepared?.issues ?? []).filter((i) => i.severity === "error");
  const warnings = (report?.issues ?? prepared?.issues ?? []).filter((i) => i.severity === "warning");
  const mapped = prepared ? Object.entries(prepared.columnMap).filter(([, col]) => col) : [];

  return (
    <div className="space-y-6">
      {/* ---- File picker ------------------------------------------- */}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-ui font-bold text-ink">1. Choose a file</h2>
        <p className="mt-1 text-micro text-slate-500">
          CSV or JSON. Column names don&apos;t need to match anything — the importer recognises the
          usual spellings from Shopify, WooCommerce and distributor spreadsheets. Exporting from
          Excel? Use <span className="font-medium text-ink">File → Save As → CSV UTF-8</span>.
        </p>

        <label
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-mist py-10 text-center transition-colors hover:border-gold-400 hover:bg-gold-50",
            phase === "running" && "pointer-events-none opacity-60",
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          <FileUp size={26} className="mb-2 text-gold-500" aria-hidden="true" />
          <span className="text-micro font-semibold text-ink">
            Drop a file here, or click to browse
          </span>
          <span className="mt-0.5 text-nano text-slate-500">.csv · .json</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>

        {phase === "reading" && (
          <p className="mt-3 flex items-center gap-2 text-micro text-slate-600">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Reading and validating…
          </p>
        )}
      </section>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/5 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#B91C1C]" aria-hidden="true" />
          <p className="text-micro text-[#B91C1C]">{error}</p>
        </div>
      )}

      {/* ---- Mapping preview --------------------------------------- */}
      {prepared && (
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-ui font-bold text-ink">2. Check the column mapping</h2>
          <p className="mt-1 text-micro text-slate-500">
            <span className="font-semibold text-ink">{prepared.filename}</span> ·{" "}
            {prepared.format.toUpperCase()} · {prepared.products.length.toLocaleString("en-IN")}{" "}
            product{prepared.products.length === 1 ? "" : "s"} ready
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-nano font-bold uppercase tracking-[0.16em] text-gold-600">
                Columns read ({mapped.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {mapped.map(([field, col]) => (
                  <li key={field} className="flex items-center gap-2 text-micro">
                    <CheckCircle2 size={12} className="shrink-0 text-[#0F7B3F]" aria-hidden="true" />
                    <span className="text-slate-500">{col}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      →
                    </span>
                    <span className="font-medium text-ink">{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-nano font-bold uppercase tracking-[0.16em] text-slate-400">
                Columns ignored ({prepared.unmapped.length})
              </h3>
              {prepared.unmapped.length === 0 ? (
                <p className="mt-2 text-micro text-slate-500">Every column was understood.</p>
              ) : (
                <>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {prepared.unmapped.map((h) => (
                      <span
                        key={h}
                        className="rounded bg-mist px-1.5 py-0.5 text-nano text-slate-500"
                      >
                        {h}
                      </span>
                    ))}
                  </p>
                  <p className="mt-2 flex items-start gap-1.5 text-nano text-slate-500">
                    <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                    If something you need is listed here, its column name isn&apos;t one the
                    importer knows. Rename it in the sheet, or add the spelling to{" "}
                    <code className="text-[10px]">ALIASES</code> in{" "}
                    <code className="text-[10px]">app/server/import/normalize.ts</code>.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ---- Options + actions ----------------------------------- */}
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-nano font-bold uppercase tracking-[0.16em] text-gold-600">
              If a product already exists
            </h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {(
                [
                  ["update", "Update it from the file", "The file becomes the source of truth. Matched on SKU first, then URL slug."],
                  ["skip", "Leave it alone", "Only genuinely new products are added. Protects products edited by hand here."],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="radio"
                    name="onConflict"
                    value={value}
                    checked={onConflict === value}
                    onChange={() => setOnConflict(value)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-gold-500"
                  />
                  <span>
                    <span className="block text-micro font-medium text-ink">{label}</span>
                    <span className="block text-nano text-slate-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void run(true)}
                disabled={phase === "running"}
              >
                Dry run — change nothing
              </Button>
              <Button size="sm" onClick={() => void run(false)} disabled={phase === "running"}>
                <Upload size={14} className="mr-1.5" aria-hidden="true" />
                Import {prepared.products.length.toLocaleString("en-IN")} products
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ---- Progress ---------------------------------------------- */}
      {phase === "running" && prepared && (
        <section className="rounded-xl border border-line bg-white p-5">
          <p className="flex items-center gap-2 text-micro font-medium text-ink">
            <Loader2 size={14} className="animate-spin text-gold-500" aria-hidden="true" />
            Importing… {progress.toLocaleString("en-IN")} of{" "}
            {prepared.products.length.toLocaleString("en-IN")}
          </p>
          <div
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-mist"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={prepared.products.length}
          >
            <div
              className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
              style={{ width: `${(progress / prepared.products.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-nano text-slate-500">
            Leave this tab open. Closing it stops the import — already-imported rows stay, and
            re-running the same file picks up where it left off.
          </p>
        </section>
      )}

      {/* ---- Report ------------------------------------------------- */}
      {report && phase === "done" && (
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-ui font-bold text-ink">
            {report.dryRun ? (
              <>
                <Info size={16} className="text-gold-500" aria-hidden="true" />
                Dry run complete — nothing was written
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-[#0F7B3F]" aria-hidden="true" />
                Import complete
              </>
            )}
          </h2>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["Created", report.created],
                ["Updated", report.updated],
                ["Skipped", report.skipped],
                ["Failed", report.failed],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-mist px-3 py-2.5">
                <dt className="text-nano uppercase tracking-wide text-slate-500">{label}</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-ui font-bold",
                    label === "Failed" && value > 0 ? "text-[#B91C1C]" : "text-ink",
                  )}
                >
                  {value.toLocaleString("en-IN")}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 text-nano text-slate-500">
            Took {(report.durationMs / 1000).toFixed(1)}s
            {report.categoriesCreated.length > 0 &&
              ` · created departments: ${[...new Set(report.categoriesCreated)].join(", ")}`}
            {report.brandsCreated.length > 0 &&
              ` · ${new Set(report.brandsCreated).size} new brand(s)`}
          </p>

          {report.categoriesCreated.length > 0 && !report.dryRun && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-gold-50 p-2.5 text-nano text-slate-600">
              <Info size={11} className="mt-0.5 shrink-0 text-gold-600" aria-hidden="true" />
              New departments are created hidden from the homepage and the main nav, so an import
              can&apos;t silently reshape the storefront. Give them artwork and turn them on in{" "}
              <span className="font-medium text-ink">Categories</span>.
            </p>
          )}

          {errors.length > 0 && (
            <IssueList
              title={`${errors.length} row(s) not imported`}
              tone="error"
              issues={errors}
            />
          )}
          {warnings.length > 0 && (
            <IssueList title={`${warnings.length} warning(s)`} tone="warning" issues={warnings} />
          )}

          <div className="mt-5 flex gap-2">
            <Button href="/admin/products" size="sm">
              View products
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrepared(null);
                setReport(null);
                setPhase("idle");
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Import another file
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

/** Collapsed by default — 500 warnings would otherwise bury the summary. */
function IssueList({
  title,
  tone,
  issues,
}: {
  title: string;
  tone: "error" | "warning";
  issues: RowIssue[];
}) {
  return (
    <details className="mt-4 rounded-lg border border-line">
      <summary
        className={cn(
          "cursor-pointer px-3 py-2 text-micro font-semibold",
          tone === "error" ? "text-[#B91C1C]" : "text-slate-600",
        )}
      >
        {title}
      </summary>
      <ul className="max-h-64 space-y-1 overflow-y-auto border-t border-line px-3 py-2">
        {issues.slice(0, 200).map((issue, i) => (
          <li key={i} className="text-nano text-slate-600">
            <span className="font-medium text-ink">Line {issue.line}</span> — {issue.message}
          </li>
        ))}
        {issues.length > 200 && (
          <li className="text-nano italic text-slate-400">
            …and {issues.length - 200} more. Run the CLI importer for the full list.
          </li>
        )}
      </ul>
    </details>
  );
}
