import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/server/prisma";
import { setSessionCookie } from "@/app/server/auth";
import { canonicalPhone } from "@/app/server/phone";

/**
 * Sign in with the mobile number registered over WhatsApp OTP — or an email
 * address (which is also how the admin account, created without a phone,
 * gets in). One field carries both: anything with an "@" is treated as an
 * email, anything else as a phone number.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const identifier =
    typeof body?.identifier === "string"
      ? body.identifier.trim()
      : typeof body?.email === "string"
        ? body.email.trim()
        : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Enter your mobile number (or email) and password." },
      { status: 400 },
    );
  }

  let user = null;
  if (identifier.includes("@")) {
    user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
  } else {
    const phone = canonicalPhone(identifier);
    if (phone) {
      const bare = phone.startsWith("91") && phone.length === 12 ? phone.slice(2) : phone;
      user = await prisma.user.findFirst({
        where: { phone: { in: [phone, `+${phone}`, bare] } },
      });
    }
  }

  // Same message either way — telling callers which half was wrong turns the
  // form into an account-enumeration oracle.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid mobile number / email or password" },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id);
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    // Where the client should go next — admins land in the panel.
    redirectTo: user.isAdmin ? "/admin" : "/",
  });
}
