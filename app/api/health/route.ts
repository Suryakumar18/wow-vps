import { NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";

/**
 * Liveness and readiness check.
 *
 * Deliberately touches the database. A health check that only proves Node is
 * running will report a happy service while every page 500s on a dead
 * connection pool — which is exactly the failure a load balancer needs to catch.
 *
 * `SELECT 1` rather than a real query: it proves the pool can hand out a
 * working connection without depending on any particular table existing.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "up", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Health check failed", err);
    return NextResponse.json(
      { status: "error", database: "down", latencyMs: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
