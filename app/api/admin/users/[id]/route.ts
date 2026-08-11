import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { getCurrentAdmin } from "@/app/server/auth";

/** Revokes admin access. The account itself is kept — orders reference it. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const me = await getCurrentAdmin();

  if (me?.id === id) {
    return NextResponse.json(
      { error: "You can't remove your own admin access." },
      { status: 409 },
    );
  }

  // Never leave the panel with no way in.
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  if (adminCount <= 1) {
    return NextResponse.json({ error: "This is the last admin account." }, { status: 409 });
  }

  await prisma.user.update({ where: { id }, data: { isAdmin: false } });
  return NextResponse.json({ ok: true });
}
