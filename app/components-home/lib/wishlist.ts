"use client";

/**
 * Wishlist — backed by Postgres via `/api/wishlist`, one row per browser (an
 * httpOnly session cookie set by the server, not read here).
 *
 * Every function here stays synchronous so none of its callers (header,
 * product cards, bottom nav) need to change: reads serve from an in-memory
 * cache that's refreshed from the server in the background, and writes
 * update the cache optimistically before the request round-trips. `save()`
 * fires the same `wishlistChange` event it always did, so every heart on the
 * page still updates from one source of truth.
 */

let cache: string[] = [];
let loaded = false;
let inFlight: Promise<void> | null = null;

function broadcast() {
  window.dispatchEvent(new CustomEvent("wishlistChange", { detail: cache }));
}

function ensureLoaded() {
  if (loaded || inFlight) return;
  inFlight = fetch("/api/wishlist")
    .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
    .then((ids) => {
      cache = ids;
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

export const getWishlist = (): string[] => {
  if (typeof window === "undefined") return [];
  ensureLoaded();
  return cache;
};

export const isWishlisted = (id: string) => getWishlist().includes(id);

export const toggleWishlistItem = (id: string): string[] => {
  const wasSaved = cache.includes(id);
  cache = wasSaved ? cache.filter((i) => i !== id) : [...cache, id];
  broadcast();

  const request = wasSaved
    ? fetch(`/api/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" })
    : fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });

  request
    .then((res) => (res.ok ? (res.json() as Promise<string[]>) : null))
    .then((ids) => {
      if (ids) {
        cache = ids;
        broadcast();
      }
    })
    .catch(() => {
      // Revert the optimistic change if the request failed.
      cache = wasSaved ? [...cache, id] : cache.filter((i) => i !== id);
      broadcast();
    });

  return cache;
};

export const removeWishlistItem = (id: string): string[] => {
  cache = cache.filter((i) => i !== id);
  broadcast();

  fetch(`/api/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" })
    .then((res) => (res.ok ? (res.json() as Promise<string[]>) : null))
    .then((ids) => {
      if (ids) {
        cache = ids;
        broadcast();
      }
    });

  return cache;
};
