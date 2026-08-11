"use client";

import { savedAddresses } from "../data/home-content";

export interface Address {
  id: string;
  label: string;
  /** Absent on the two seeded demo addresses, which predate this field. */
  name?: string;
  line: string;
  phone: string;
}

export interface NewAddressInput {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

/**
 * Address book — backed by Postgres via `/api/addresses`, scoped to this
 * browser's session cookie until checkout claims it for a guest customer or
 * account.
 *
 * `getAddresses`/`addAddress` stay synchronous so existing callers (Cart,
 * Checkout) don't need to restructure around a promise: reads serve the
 * seeded addresses immediately plus whatever's in the in-memory cache, which
 * is refreshed from the server in the background and broadcast via
 * `addressesChange` — the same event-driven pattern `wishlist.ts` uses.
 */

let cache: Address[] = [];
let loaded = false;
let inFlight: Promise<void> | null = null;

function broadcast() {
  window.dispatchEvent(new CustomEvent("addressesChange"));
}

function ensureLoaded() {
  if (loaded || inFlight) return;
  inFlight = fetch("/api/addresses")
    .then((res) => (res.ok ? (res.json() as Promise<Address[]>) : []))
    .then((all) => {
      // Server response already includes the seeded addresses up front.
      cache = all.filter((a) => !savedAddresses.some((seeded) => seeded.id === a.id));
      broadcast();
    })
    .catch(() => {
      /* keep the empty cache — a retry happens on the next mutation */
    })
    .finally(() => {
      loaded = true;
      inFlight = null;
    });
}

export function getAddresses(): Address[] {
  if (typeof window === "undefined") return [...savedAddresses];
  ensureLoaded();
  return [...savedAddresses, ...cache];
}

export function addAddress(input: NewAddressInput): Address[] {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `addr-${Date.now()}`;

  const optimistic: Address = {
    id,
    label: input.label.trim() || "Address",
    name: input.fullName.trim(),
    line: `${input.line1.trim()}, ${input.city.trim()} - ${input.pincode.trim()}, ${input.state.trim()}`,
    phone: input.phone.trim(),
  };
  cache = [...cache, optimistic];
  broadcast();

  fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
    .then((res) => (res.ok ? (res.json() as Promise<Address[]>) : null))
    .then((all) => {
      if (all) {
        cache = all.filter((a) => !savedAddresses.some((seeded) => seeded.id === a.id));
        broadcast();
      }
    })
    .catch(() => {
      cache = cache.filter((a) => a.id !== id);
      broadcast();
    });

  return [...savedAddresses, ...cache];
}
