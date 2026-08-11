import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * OTP crypto helpers.
 *
 * The database only ever sees an HMAC of the code, so a leaked `phone_otps`
 * table can't be replayed. After a successful verification the client gets a
 * short-lived signed "phone proof" token; the register endpoint accepts that
 * token as evidence the phone was verified, which keeps the two requests
 * (verify, then create account) from needing server-side session state.
 *
 * Signing reuses ADMIN_AUTH_SECRET — the same secret that already signs every
 * session cookie (see auth.ts), so there's one secret to rotate, not two.
 */

/** How long the "phone verified" proof stays valid after a successful OTP. */
const PROOF_TTL_MS = 15 * 60 * 1000;

function secret(): string {
  const value = process.env.ADMIN_AUTH_SECRET;
  if (!value) throw new Error("ADMIN_AUTH_SECRET is not set");
  return value;
}

/** Six digits, crypto-random, zero-padded ("004217" is a valid code). */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(phone: string, code: string): string {
  return createHmac("sha256", secret()).update(`otp:${phone}:${code}`).digest("hex");
}

/** Constant-time comparison of a submitted code against the stored hash. */
export function otpCodeMatches(phone: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtpCode(phone, code));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

const signProof = (payload: string) =>
  createHmac("sha256", secret()).update(`phone-proof:${payload}`).digest("hex");

/** Issued after a correct OTP; consumed by /api/auth/register. */
export function issuePhoneProof(phone: string): string {
  const payload = `${phone}.${Date.now() + PROOF_TTL_MS}`;
  return `${payload}.${signProof(payload)}`;
}

/** Returns the canonical phone the proof vouches for, or null. */
export function verifyPhoneProof(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [phone, expiresRaw, signature] = parts;

  const expected = signProof(`${phone}.${expiresRaw}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return phone;
}
