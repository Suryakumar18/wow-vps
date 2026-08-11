import "server-only";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "./auth";

/**
 * Gate for every admin API route. Returns a 401 response to return early with,
 * or null when the caller is a signed-in admin.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
