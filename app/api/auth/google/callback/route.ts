import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { generateToken } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
    }

    // Get Google user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser = await userInfoRes.json();
    if (!gUser.email) {
      return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId: gUser.id }, { email: gUser.email }] });
    if (!user) {
      user = await User.create({
        fullname: gUser.name || gUser.email.split("@")[0],
        email: gUser.email,
        googleId: gUser.id,
        mobilenumber: null,
        role: "user",
      });
    } else if (!user.googleId) {
      user.googleId = gUser.id;
      await user.save();
    }

    const token = generateToken(String(user._id), user.role);
    const userData = encodeURIComponent(JSON.stringify({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      mobilenumber: user.mobilenumber,
      role: user.role,
      token,
    }));

    return NextResponse.redirect(
      `${APP_URL}/auth/google-success?token=${token}&user=${userData}`
    );
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
  }
}
