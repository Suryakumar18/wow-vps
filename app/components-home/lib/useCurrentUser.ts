"use client";

import { useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * The signed-in customer, from `/api/auth/me`.
 *
 * Returns `undefined` while loading, `null` for guests, the user otherwise.
 * The result is cached module-wide and the request de-duplicated, so the
 * header, mobile menu, bottom nav and orders page asking in the same render
 * cycle cost one fetch — and navigation between pages doesn't re-ask at all.
 * Login/logout do a full navigation (router.push + refresh), which reloads
 * the bundle and clears this cache, so it can't go stale across a sign-in.
 */

let cached: CurrentUser | null | undefined;
let inFlight: Promise<CurrentUser | null> | null = null;

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
    fetchUser().then((u) => {
      if (live) setUser(u);
    });
    return () => {
      live = false;
    };
  }, []);

  return user;
}
