import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * One session for the whole app.
 *
 * Customers and admins sign in through the same `/login` portal and get the
 * same signed cookie; `isAdmin` on the user row is what decides where they
 * land and what they may call. A separate admin login would mean two session
 * systems to keep in step, which is how one of them ends up subtly weaker.
 */

const COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const value = process.env.ADMIN_AUTH_SECRET;
  if (!value) throw new Error("ADMIN_AUTH_SECRET is not set");
  return value;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function issueToken(userId: string): string {
  const payload = `${userId}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;

  const expected = sign(`${userId}.${expiresRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return userId;
}

export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(COOKIE, issueToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const userId = verifyToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
}

/** The signed-in user, but only when they're an admin. */
export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}
