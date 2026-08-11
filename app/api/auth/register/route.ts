import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/server/prisma";
import { setSessionCookie } from "@/app/server/auth";
import { canonicalPhone } from "@/app/server/phone";
import { verifyPhoneProof } from "@/app/server/otp";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const phoneToken = typeof body?.phoneToken === "string" ? body.phoneToken : "";

  if (name.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "Use at least 6 characters." }, { status: 400 });
  }

  // The phone must have been proven over WhatsApp OTP in this browser within
  // the last 15 minutes: the token from /api/auth/otp/verify vouches for one
  // exact canonical number, and the number submitted here must be that one.
  const phone = rawPhone ? canonicalPhone(rawPhone) : null;
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }
  const provenPhone = phoneToken ? verifyPhoneProof(phoneToken) : null;
  if (!provenPhone || provenPhone !== phone) {
    return NextResponse.json(
      { error: "Phone verification has expired — verify your number again." },
      { status: 401 },
    );
  }

  const bare = phone.startsWith("91") && phone.length === 12 ? phone.slice(2) : phone;
  const [emailTaken, phoneTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findFirst({ where: { phone: { in: [phone, `+${phone}`, bare] } } }),
  ]);
  if (emailTaken) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  if (phoneTaken) {
    return NextResponse.json(
      { error: "An account with this mobile number already exists." },
      { status: 409 },
    );
  }

  // Registration never grants admin — that flag is set deliberately, in the
  // admin panel or the seed script, never by whoever fills in this form.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      isAdmin: false,
    },
  });

  // The proof is spent — clear this phone's OTP rows so the table stays small.
  await prisma.phoneOtp.deleteMany({ where: { phone } }).catch(() => {});

  await setSessionCookie(user.id);
  return NextResponse.json(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: false,
      redirectTo: "/",
    },
    { status: 201 },
  );
}
