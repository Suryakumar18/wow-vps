import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateHomepage } from "@/app/server/revalidate";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(
    await prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }),
  );
}

/** Bulk save — the settings screen submits every field it rendered at once. */
export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const entries = body?.settings as Record<string, string> | undefined;
  if (!entries || typeof entries !== "object") {
    return NextResponse.json({ error: "Expected a settings object." }, { status: 400 });
  }

  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.siteSetting.update({ where: { key }, data: { value: String(value) } }),
    ),
  );
  revalidateHomepage();
  return NextResponse.json({ ok: true, updated: Object.keys(entries).length });
}
