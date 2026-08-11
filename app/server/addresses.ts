import "server-only";
import { prisma } from "./prisma";
import { getOrCreateSessionId } from "./session";
import { getCurrentUser } from "./auth";
import type { Address, NewAddressInput } from "@/app/components-home/lib/addresses";

function toAddress(row: {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}): Address {
  return {
    id: row.id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    line: `${row.line1}, ${row.city} - ${row.pincode}, ${row.state}`,
  };
}

/**
 * Signed-in customers see their account's addresses plus anything saved in
 * this browser session before they logged in; guests see the session's only.
 */
export async function getAddressesDb(): Promise<Address[]> {
  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);
  const rows = await prisma.address.findMany({
    where: user ? { OR: [{ userId: user.id }, { sessionId }] } : { sessionId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toAddress);
}

export async function addAddressDb(input: NewAddressInput): Promise<Address[]> {
  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);
  await prisma.address.create({
    data: {
      sessionId,
      // Owned by the account when signed in, so it follows the customer to
      // their next device instead of dying with this browser's cookie.
      userId: user?.id ?? null,
      label: input.label.trim() || "Address",
      name: input.fullName.trim(),
      phone: input.phone.trim(),
      line1: input.line1.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
    },
  });
  return getAddressesDb();
}
