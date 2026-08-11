import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateStorefront } from "@/app/server/revalidate";
import { runImport } from "@/app/server/import/run";
import type { ImportProduct, RowIssue } from "@/app/server/import/normalize";

/**
 * One chunk of a bulk import.
 *
 * The file is parsed and validated in the browser and posted here in slices,
 * rather than uploaded whole and processed in a single request. Three reasons:
 *
 *  - A 3,000-row import takes 12–35 seconds of database work. That exceeds the
 *    request timeout on most serverless platforms, so one big request would
 *    fail *after* writing part of the catalogue.
 *  - Slices give the operator a real progress bar instead of a spinner and a
 *    guess.
 *  - A slice that fails can be retried on its own; `runImport` is idempotent,
 *    so a retry converges rather than duplicating.
 */

/** Bounded so a malformed or hostile request can't ask for unbounded work. */
const MAX_ROWS_PER_CHUNK = 500;

interface Body {
  products?: ImportProduct[];
  issues?: RowIssue[];
  onConflict?: "skip" | "update";
  dryRun?: boolean;
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Body | null;
  const products = body?.products;

  if (!Array.isArray(products)) {
    return NextResponse.json({ error: "products must be an array" }, { status: 400 });
  }
  if (products.length > MAX_ROWS_PER_CHUNK) {
    return NextResponse.json(
      { error: `A chunk may contain at most ${MAX_ROWS_PER_CHUNK} products.` },
      { status: 413 },
    );
  }

  try {
    const report = await runImport(prisma, products, body?.issues ?? [], {
      dryRun: body?.dryRun ?? false,
      onConflict: body?.onConflict ?? "update",
      // Already a slice; one round trip per chunk.
      batchSize: MAX_ROWS_PER_CHUNK,
    });

    // An import can create departments and brands (nav and facet counts) and
    // can flag products as featured or deals (the prerendered homepage's rows).
    if (!report.dryRun) revalidateStorefront();

    return NextResponse.json(report);
  } catch (err) {
    console.error("Product import chunk failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message.split("\n")[0] : "Import failed." },
      { status: 500 },
    );
  }
}
