import "server-only";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "wow_session";

/** Reads the guest session id, creating and persisting one if this is a first visit. */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}
