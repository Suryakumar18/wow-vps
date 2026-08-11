import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { getCurrentAdmin } from "@/app/server/auth";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (next.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }

  // Re-check the current password even though the session is valid — otherwise
  // an unattended open tab is enough to take the account over.
  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
  return NextResponse.json({ ok: true });
}
