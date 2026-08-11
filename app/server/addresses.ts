import "server-only";
import { prisma } from "./prisma";
import { getOrCreateSessionId } from "./session";
import { savedAddresses } from "@/app/components-home/data/home-content";
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

export async function getAddressesDb(): Promise<Address[]> {
  const sessionId = await getOrCreateSessionId();
  const rows = await prisma.address.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  return [...savedAddresses, ...rows.map(toAddress)];
}

export async function addAddressDb(input: NewAddressInput): Promise<Address[]> {
  const sessionId = await getOrCreateSessionId();
  await prisma.address.create({
    data: {
      sessionId,
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
