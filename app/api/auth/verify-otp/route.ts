import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Token from "@/lib/models/Token";
import PendingOTP from "@/lib/models/PendingOTP";
import { generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return Response.json({ success: false, message: "Email and OTP are required" }, { status: 400 });
    }

    const pending = await PendingOTP.findOne({ email: email.toLowerCase() });
    if (!pending) {
      return Response.json({ success: false, message: "OTP expired or not found. Please request a new code." }, { status: 400 });
    }

    if (pending.otp !== otp.trim()) {
      return Response.json({ success: false, message: "Invalid verification code. Please try again." }, { status: 400 });
    }

    // Double-check user doesn't exist yet
    const existing = await User.findOne({ $or: [{ email: pending.email }, { mobilenumber: pending.mobilenumber }] });
    if (existing) {
      await PendingOTP.deleteOne({ email: email.toLowerCase() });
      return Response.json({ success: false, message: "An account with this email or mobile already exists." }, { status: 400 });
    }

    // Create the user (password gets hashed by pre-save hook)
    const user = await User.create({
      fullname: pending.fullname,
      email: pending.email,
      mobilenumber: pending.mobilenumber,
      password: pending.password,
      role: "user",
    });

    // Clean up OTP record
    await PendingOTP.deleteOne({ email: email.toLowerCase() });

    const token = generateToken(String(user._id), user.role);
    await Token.create({
      userId: user._id,
      token,
      userAgent: req.headers.get("user-agent"),
      ipAddress: req.headers.get("x-forwarded-for"),
      lastUsedAt: new Date(),
      isActive: true,
    });

    return Response.json({
      success: true,
      message: "Account created successfully! Welcome to WOW Lifestyle.",
      data: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        mobilenumber: user.mobilenumber,
        role: user.role,
        token,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("verify-otp error:", err);
    return Response.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
