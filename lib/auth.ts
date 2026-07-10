import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface JWTPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function generateToken(id: string, role: string): string {
  // Cast to any to avoid jsonwebtoken StringValue constraint on expiresIn
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRE || "7d") as any,
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.split(" ")[1];
  }
  return null;
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** Returns 401 response if not authenticated */
export function requireAuth(req: NextRequest): { user: JWTPayload } | { error: Response } {
  const user = getUserFromRequest(req);
  if (!user) {
    return {
      error: Response.json({ success: false, message: "Not authorized, no token provided" }, { status: 401 }),
    };
  }
  return { user };
}

/** Returns 403 response if not admin */
export function requireAdmin(req: NextRequest): { user: JWTPayload } | { error: Response } {
  const result = requireAuth(req);
  if ("error" in result) return result;
  if (result.user.role !== "admin") {
    return {
      error: Response.json({ success: false, message: "Access denied. Admin privileges required." }, { status: 403 }),
    };
  }
  return result;
}
