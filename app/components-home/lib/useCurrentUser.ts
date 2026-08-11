"use client";

import { useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  phone?: string | null;
}

/**
 * The signed-in customer, from `/api/auth/me`.
 *
 * Returns `undefined` while loading, `null` for guests, the user otherwise.
 * The result is cached module-wide and the request de-duplicated, so the
 * header, mobile menu, bottom nav and orders page asking in the same render
 * cycle cost one fetch. Login, logout and profile edits push the new state
 * through `setCurrentUser`, which notifies every mounted subscriber — the
 * header flips between "Sign In" and the customer's name without a reload.
 */

let cached: CurrentUser | null | undefined;
let inFlight: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

/** Called after login/register/logout/profile-save with the fresh state. */
export function setCurrentUser(user: CurrentUser | null) {
  cached = user;
  inFlight = null;
  listeners.forEach((notify) => notify(user));
}

function fetchUser(): Promise<CurrentUser | null> {
  if (cached !== undefined) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((body: { user: CurrentUser | null }) => {
        cached = body.user ?? null;
        return cached;
      })
      .catch(() => {
        // Leave `cached` unset so a transient failure retries on next mount.
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useCurrentUser(): CurrentUser | null | undefined {
  const [user, setUser] = useState<CurrentUser | null | undefined>(cached);

  useEffect(() => {
    let live = true;
    const listener = (next: CurrentUser | null) => {
      if (live) setUser(next);
    };
    listeners.add(listener);
    fetchUser().then((next) => {
      if (live) setUser(next);
    });
    return () => {
      live = false;
      listeners.delete(listener);
    };
  }, []);

  return user;
}
