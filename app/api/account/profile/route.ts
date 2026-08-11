import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { getCurrentUser } from "@/app/server/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Updates the signed-in customer's name and email. Phone stays OTP-bound. */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (name.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken && taken.id !== user.id) {
    return NextResponse.json(
      { error: "That email is already used by another account." },
      { status: 409 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
    select: { id: true, name: true, email: true, phone: true, isAdmin: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
