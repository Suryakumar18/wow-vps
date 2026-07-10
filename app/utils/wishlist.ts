'use client';

// Wishlist stored in localStorage (works for guests) and synced to the
// server (/api/user/wishlist) when the customer is logged in.

const KEY = 'wishlist';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || null : null;

export const getWishlist = (): string[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

const save = (ids: string[]) => {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('wishlistChange', { detail: ids }));
};

export const isWishlisted = (id: string) => getWishlist().includes(id);

export const toggleWishlistItem = (id: string): string[] => {
  const list = getWishlist();
  const next = list.includes(id) ? list.filter(i => i !== id) : [...list, id];
  save(next);

  const token = getToken();
  if (token) {
    fetch('/api/user/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: id, action: list.includes(id) ? 'remove' : 'add' }),
    }).catch(() => {});
  }
  return next;
};

export const removeWishlistItem = (id: string): string[] => {
  const next = getWishlist().filter(i => i !== id);
  save(next);
  const token = getToken();
  if (token) {
    fetch('/api/user/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: id, action: 'remove' }),
    }).catch(() => {});
  }
  return next;
};

/** Merge the server wishlist into localStorage (call on page load when logged in). */
export const syncWishlistFromServer = async (): Promise<string[]> => {
  const token = getToken();
  if (!token) return getWishlist();
  try {
    const res = await fetch('/api/user/wishlist', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      const serverIds = data.data.map((v: any) => String(v?._id || v));
      const merged = Array.from(new Set([...getWishlist(), ...serverIds]));
      save(merged);
      // push any local-only ids up to the server
      const localOnly = merged.filter(id => !serverIds.includes(id));
      localOnly.forEach(id => {
        fetch('/api/user/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: id, action: 'add' }),
        }).catch(() => {});
      });
      return merged;
    }
  } catch { /* offline / expired token — fall back to local list */ }
  return getWishlist();
};
