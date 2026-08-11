import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { canonicalPhone, displayPhone } from "@/app/server/phone";
import { generateOtpCode, hashOtpCode } from "@/app/server/otp";
import { sendOtpWhatsApp, whatsappConfigured } from "@/app/server/whatsapp";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_HOUR = 6;
const PURPOSE = "register";

/**
 * Step 1 of registration: send a one-time code to the customer's WhatsApp.
 *
 * Rate limiting is per phone number and lives in the phone_otps table itself
 * (cooldown = newest row's age, hourly cap = row count), so it holds across
 * server restarts and multiple instances without a separate store.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";

  const phone = canonicalPhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }

  // Already registered? Send them to login instead of burning a message.
  // Older rows may hold the number in a looser format, so match the common
  // spellings of the same digits.
  const bare = phone.startsWith("91") && phone.length === 12 ? phone.slice(2) : phone;
  const existing = await prisma.user.findFirst({
    where: { phone: { in: [phone, `+${phone}`, bare] } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this mobile number already exists — please log in." },
      { status: 409 },
    );
  }

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);

  const [latest, sentThisHour] = await Promise.all([
    prisma.phoneOtp.findFirst({
      where: { phone, purpose: PURPOSE },
      orderBy: { createdAt: "desc" },
    }),
    prisma.phoneOtp.count({
      where: { phone, purpose: PURPOSE, createdAt: { gt: hourAgo } },
    }),
  ]);

  if (latest) {
    const sinceLast = now - latest.createdAt.getTime();
    if (sinceLast < RESEND_COOLDOWN_MS) {
      const retryInSeconds = Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000);
      return NextResponse.json(
        { error: `Please wait ${retryInSeconds}s before requesting another code.`, retryInSeconds },
        { status: 429 },
      );
    }
  }
  if (sentThisHour >= MAX_SENDS_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many codes requested for this number. Try again in an hour." },
      { status: 429 },
    );
  }

  const code = generateOtpCode();

  if (whatsappConfigured()) {
    try {
      await sendOtpWhatsApp(phone, code);
    } catch (err) {
      console.error("Couldn't send OTP on WhatsApp:", err);
      return NextResponse.json(
        { error: "Couldn't send the code on WhatsApp. Check the number and try again." },
        { status: 502 },
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("OTP requested but WhatsApp env vars are not configured.");
    return NextResponse.json(
      { error: "Verification is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  } else {
    // Local development without WhatsApp credentials: the flow still works,
    // the code just arrives in the terminal instead of on a phone.
    console.log(`[dev] WhatsApp OTP for ${phone}: ${code}`);
  }

  // Record only after a successful (or dev-skipped) send, so delivery
  // failures don't eat into the hourly budget. Sweep stale rows in passing.
  await prisma.phoneOtp.create({
    data: {
      phone,
      purpose: PURPOSE,
      codeHash: hashOtpCode(phone, code),
      expiresAt: new Date(now + OTP_TTL_MS),
    },
  });
  await prisma.phoneOtp.deleteMany({
    where: { createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({
    ok: true,
    phone: displayPhone(phone),
    resendInSeconds: RESEND_COOLDOWN_MS / 1000,
    expiresInSeconds: OTP_TTL_MS / 1000,
    // Never present in production: lets the register flow be exercised
    // locally before WhatsApp credentials exist.
    ...(whatsappConfigured() || process.env.NODE_ENV === "production" ? {} : { devCode: code }),
  });
}
