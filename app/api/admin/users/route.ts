import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(
    await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  );
}

/** Creates a new admin, or promotes an existing customer account. */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) return NextResponse.json({ error: "Enter a name." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for the password." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.isAdmin) {
    return NextResponse.json({ error: "That email is already an admin." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // An existing customer is promoted rather than duplicated — email is unique,
  // so creating a second row would fail anyway.
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { isAdmin: true, name, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
      })
    : await prisma.user.create({
        data: { name, email, passwordHash, isAdmin: true },
        select: { id: true, name: true, email: true, createdAt: true },
      });

  return NextResponse.json({ ...user, promoted: Boolean(existing) }, { status: 201 });
}
