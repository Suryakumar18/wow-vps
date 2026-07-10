import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Token from "@/lib/models/Token";
import { generateToken, requireAuth, getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  await connectDB();

  // Route based on action in body
  const body = await req.json();
  const action = body.action;

  // REGISTER
  if (action === "register") {
    const { fullname, email, mobilenumber, password } = body;
    const existing = await User.findOne({ $or: [{ email }, { mobilenumber }] });
    if (existing) return Response.json({ success: false, message: "User already exists with this email or mobile number" }, { status: 400 });

    const user = await User.create({ fullname, email, mobilenumber, password });
    const token = generateToken(String(user._id), user.role);
    return Response.json({ success: true, message: "User registered successfully", data: { _id: user._id, fullname: user.fullname, email: user.email, mobilenumber: user.mobilenumber, role: user.role, token } }, { status: 201 });
  }

  // LOGIN
  if (action === "login") {
    const { email, password } = body;
    if (!email || !password) return Response.json({ success: false, message: "Please provide email and password" }, { status: 400 });
    const user = await User.findOne({ email });
    if (!user) return Response.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    if (user.googleId && !user.password) return Response.json({ success: false, message: "This account uses Google Sign-In. Please login with Google." }, { status: 401 });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return Response.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    const token = generateToken(String(user._id), user.role);
    await Token.create({ userId: user._id, token, userAgent: req.headers.get("user-agent"), ipAddress: req.headers.get("x-forwarded-for"), lastUsedAt: new Date(), isActive: true });
    return Response.json({ success: true, message: "Login successful", data: { _id: user._id, fullname: user.fullname, email: user.email, mobilenumber: user.mobilenumber, role: user.role, token } });
  }

  // LOGOUT
  if (action === "logout") {
    const jwtUser = getUserFromRequest(req);
    const rawToken = req.headers.get("authorization")?.split(" ")[1];
    if (rawToken) await Token.findOneAndUpdate({ token: rawToken }, { isActive: false });
    return Response.json({ success: true, message: "Logged out successfully" });
  }

  return Response.json({ success: false, message: "Invalid action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;
  const user = await User.findById(result.user.id).select("-password");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });
  return Response.json({ success: true, data: user });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;
  const { fullname, mobilenumber } = await req.json();
  const user = await User.findById(result.user.id);
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });
  if (mobilenumber && mobilenumber !== user.mobilenumber) {
    const existing = await User.findOne({ mobilenumber });
    if (existing) return Response.json({ success: false, message: "Mobile number already in use" }, { status: 400 });
  }
  user.fullname = fullname || user.fullname;
  user.mobilenumber = mobilenumber || user.mobilenumber;
  await user.save();
  return Response.json({ success: true, message: "Profile updated successfully", data: { _id: user._id, fullname: user.fullname, email: user.email, mobilenumber: user.mobilenumber, role: user.role } });
}
