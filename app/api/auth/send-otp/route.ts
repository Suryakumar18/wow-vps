import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import PendingOTP from "@/lib/models/PendingOTP";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "WOW Lifestyle <onboarding@resend.dev>";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildEmailHTML(otp: string, fullname: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1px solid #222;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #222;text-align:center;">
            <div style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:#C9A84C;">WOW LIFESTYLE</div>
            <div style="font-size:11px;letter-spacing:0.3em;color:#555;margin-top:4px;text-transform:uppercase;">Thuriur · Premium Toys</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:14px;color:#888;">Hello, <span style="color:#F0EAD6;font-weight:600;">${fullname}</span></p>
            <h2 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#F0EAD6;line-height:1.4;">
              Your verification code
            </h2>
            <!-- OTP Box -->
            <div style="background:#1a1a1a;border:1px solid #C9A84C33;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
              <div style="font-size:42px;font-weight:800;letter-spacing:0.25em;color:#C9A84C;font-family:'Courier New',monospace;">
                ${otp}
              </div>
              <div style="font-size:12px;color:#666;margin-top:10px;letter-spacing:0.05em;">
                Expires in <strong style="color:#888;">10 minutes</strong>
              </div>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#666;line-height:1.7;">
              Enter this code on the verification screen to complete your registration.
              Do not share this code with anyone.
            </p>
            <p style="margin:0;font-size:13px;color:#444;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1c1c1c;text-align:center;">
            <div style="font-size:11px;color:#444;letter-spacing:0.05em;">
              © ${new Date().getFullYear()} WOW Lifestyle Thuriur. All rights reserved.
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { fullname, email, mobilenumber, password } = await req.json();

    // Validate fields
    if (!fullname || !email || !mobilenumber || !password) {
      return Response.json({ success: false, message: "All fields are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, message: "Invalid email address" }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(mobilenumber.replace(/\D/g, ""))) {
      return Response.json({ success: false, message: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ success: false, message: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobilenumber: mobilenumber.replace(/\D/g, "") }] });
    if (existing) {
      return Response.json({ success: false, message: "An account with this email or mobile already exists" }, { status: 400 });
    }

    const otp = generateOTP();

    // Upsert PendingOTP (replace if previous request existed)
    await PendingOTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), otp, fullname, mobilenumber: mobilenumber.replace(/\D/g, ""), password, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `${otp} — Your WOW Lifestyle Verification Code`,
        html: buildEmailHTML(otp, fullname),
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.json().catch(() => ({}));
      console.error("Resend error:", errBody);
      return Response.json({ success: false, message: "Failed to send verification email. Please try again." }, { status: 500 });
    }

    return Response.json({ success: true, message: `Verification code sent to ${email}` });
  } catch (err) {
    console.error("send-otp error:", err);
    return Response.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
