import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/server/prisma";
import { setSessionCookie } from "@/app/server/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message either way — telling callers which half was wrong turns the
  // form into an account-enumeration oracle.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    // Where the client should go next — admins land in the panel.
    redirectTo: user.isAdmin ? "/admin" : "/",
  });
}
