import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { canonicalPhone, displayPhone } from "@/app/server/phone";
import { issuePhoneProof, otpCodeMatches } from "@/app/server/otp";

const MAX_ATTEMPTS = 5;
const PURPOSE = "register";

/**
 * Step 2 of registration: check the code the customer typed.
 *
 * Success returns a signed, 15-minute `phoneToken`; /api/auth/register
 * accepts it as proof this phone was verified, so no server-side state has
 * to survive between this request and the final "create account" submit.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const phone = canonicalPhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const otp = await prisma.phoneOtp.findFirst({
    where: { phone, purpose: PURPOSE },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.verifiedAt || otp.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This code has expired — request a new one." },
      { status: 400 },
    );
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many wrong attempts — request a new code." },
      { status: 429 },
    );
  }

  // Count the attempt before judging it, so a crash after the comparison
  // can't hand out unlimited guesses.
  await prisma.phoneOtp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (!otpCodeMatches(phone, code, otp.codeHash)) {
    const left = MAX_ATTEMPTS - otp.attempts - 1;
    return NextResponse.json(
      {
        error:
          left > 0
            ? `That code isn't right — ${left} ${left === 1 ? "try" : "tries"} left.`
            : "That code isn't right — request a new one.",
      },
      { status: 400 },
    );
  }

  await prisma.phoneOtp.update({
    where: { id: otp.id },
    data: { verifiedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    phone: displayPhone(phone),
    phoneToken: issuePhoneProof(phone),
  });
}
