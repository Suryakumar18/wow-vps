"use client";

export interface Address {
  id: string;
  /** Absent on legacy rows created before this field existed. */
  name?: string;
  label: string;
  line: string;
  phone: string;
  /**
   * The address in its separate parts, as well as the composed `line`.
   *
   * `line` is what every list renders, but an edit form has to put each value
   * back in its own field — and splitting the composed string to get there
   * would break on any address whose street contains a comma. Optional so rows
   * cached by an older build still typecheck.
   */
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
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
 * Address book — backed by Postgres via `/api/addresses`. Rows belong to the
 * signed-in account when there is one, and to this browser's session cookie
 * otherwise (checkout later claims session rows for the guest customer).
 *
 * `getAddresses`/`addAddress` stay synchronous so existing callers (Cart,
 * Checkout) don't need to restructure around a promise: reads serve the
 * in-memory cache, which is refreshed from the server in the background and
 * broadcast via `addressesChange` — the same event-driven pattern
 * `wishlist.ts` uses.
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
      cache = all;
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
  if (typeof window === "undefined") return [];
  ensureLoaded();
  return [...cache];
}

/** The one place the composed one-line form of an address is built. */
export function composeLine(input: {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}): string {
  return `${input.line1.trim()}, ${input.city.trim()} - ${input.pincode.trim()}, ${input.state.trim()}`;
}

export function addAddress(input: NewAddressInput): Address[] {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `addr-${Date.now()}`;

  const optimistic: Address = {
    id,
    label: input.label.trim() || "Address",
    name: input.fullName.trim(),
    line: composeLine(input),
    phone: input.phone.trim(),
    line1: input.line1.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    pincode: input.pincode.trim(),
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
        cache = all;
        broadcast();
      }
    })
    .catch(() => {
      cache = cache.filter((a) => a.id !== id);
      broadcast();
    });

  return [...cache];
}

/**
 * Edit a saved address in place.
 *
 * Applied optimistically like `addAddress`, but the previous version is kept so
 * a failed write can be rolled back — silently leaving a wrong address selected
 * at checkout is worse than the edit appearing not to take.
 */
export function updateAddress(id: string, input: NewAddressInput): Address[] {
  const previous = cache.find((a) => a.id === id);

  cache = cache.map((a) =>
    a.id === id
      ? {
          ...a,
          label: input.label.trim() || "Address",
          name: input.fullName.trim(),
          line: composeLine(input),
          phone: input.phone.trim(),
          line1: input.line1.trim(),
          city: input.city.trim(),
          state: input.state.trim(),
          pincode: input.pincode.trim(),
        }
      : a,
  );
  broadcast();

  fetch("/api/addresses", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...input }),
  })
    .then((res) => (res.ok ? (res.json() as Promise<Address[]>) : null))
    .then((all) => {
      if (all) {
        cache = all;
        broadcast();
      } else if (previous) {
        cache = cache.map((a) => (a.id === id ? previous : a));
        broadcast();
      }
    })
    .catch(() => {
      if (previous) {
        cache = cache.map((a) => (a.id === id ? previous : a));
        broadcast();
      }
    });

  return [...cache];
}
