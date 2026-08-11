import "server-only";

/**
 * Phone canonicalisation for OTP verification and WhatsApp delivery.
 *
 * Everything is stored and sent as digits with country code and no "+" —
 * the exact `to` format the WhatsApp Cloud API wants, e.g. "919876543210".
 * A bare 10-digit number is assumed Indian (+91): the store prices in rupees
 * and ships to Indian addresses, the same assumption orders.ts already makes
 * when it matches customers by trailing 10 digits.
 */
export function canonicalPhone(raw: string): string | null {
  const digits = raw.replace(/\D+/g, "").replace(/^0+/, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  // Anything else must already carry its country code: E.164 tops out at 15.
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

/** "+91 98765 43210" style, for showing the number back to the customer. */
export function displayPhone(canonical: string): string {
  if (canonical.startsWith("91") && canonical.length === 12) {
    return `+91 ${canonical.slice(2, 7)} ${canonical.slice(7)}`;
  }
  return `+${canonical}`;
}
