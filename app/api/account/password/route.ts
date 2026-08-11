import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/server/prisma";
import { getCurrentUser } from "@/app/server/auth";

/** Changes the signed-in customer's password after proving the current one. */
export async function POST(request: NextRequest) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Use at least 6 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  return NextResponse.json({ ok: true });
}
