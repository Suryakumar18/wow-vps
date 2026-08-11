"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  brand?: string;
  category?: string;
  totalStock: number;
  /** Per-product shipping (₹); summed once per line. Absent/0 = free. */
  shippingFee?: number;
  /** Per-product GST rate (integer %). 0 or missing = tax-exempt. */
  gstPercent?: number;
}

interface CartContextValue {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  /** False until the cart has been read back from the server — gates any "cart is empty" guard so it can't false-flag a cart that just hasn't loaded yet. */
  hydrated: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  /** Clamped to 1…stock; the cart page's steppers drive this. */
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  /** Coupon lives here, not on the Cart page, so Checkout sees the same discount. */
  couponCode: string | null;
  discountPercent: number;
  applyCoupon: (code: string) => Promise<{ ok: boolean; message?: string }>;
  removeCoupon: () => void;
  /** Set once if the cart shrank below the applied coupon's minimum order — read it, then clear it with `dismissCouponWarning`. */
  couponWarning: string | null;
  dismissCouponWarning: () => void;

  /**
   * The delivery address chosen on Cart or Checkout, shared between them so
   * picking "Work" on one screen doesn't silently revert to the first saved
   * address on the other. Callers still resolve the id against their own
   * `getAddresses()` list — this only tracks *which one* is selected.
   */
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string) => void;

  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

interface ServerCart {
  items: CartItem[];
  subtotal: number;
  couponCode: string | null;
  discountPercent: number;
  couponWarning: string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const ADDRESS_ID_KEY = "cart-address-id";

/**
 * Cart — backed by Postgres via `/api/cart*`, one row per browser (an httpOnly
 * session cookie set by the server, not read here). Item/coupon mutations
 * update local state immediately so the UI never waits on a round trip, then
 * fire the API call and reconcile with whatever the server returns — which is
 * also where an applied coupon gets re-validated against the live subtotal.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponWarning, setCouponWarning] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressIdState] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Set the moment any mutation fires. The initial GET below checks it before
  // applying its (possibly pre-mutation) snapshot — without this, "Buy Now"
  // clicked before the first load resolves lets the stale GET response land
  // last and wipe the just-added product from view.
  const mutatedRef = useRef(false);

  const applyServerCart = useCallback((server: ServerCart) => {
    setCart(server.items);
    setSubtotal(server.subtotal);
    setCouponCode(server.couponCode);
    setDiscountPercent(server.discountPercent);
    if (server.couponWarning) setCouponWarning(server.couponWarning);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart");
        if (cancelled) return;
        if (res.ok && !mutatedRef.current) applyServerCart(await res.json());
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyServerCart]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADDRESS_ID_KEY);
      if (saved) setSelectedAddressIdState(saved);
    } catch {
      /* unavailable storage */
    }
  }, []);

  const addToCart = useCallback(
    (item: CartItem) => {
      if (item.totalStock <= 0) return;
      mutatedRef.current = true;

      setCart((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          if (existing.quantity >= item.totalStock) return prev;
          return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [...prev, { ...item, quantity: 1 }];
      });

      (async () => {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.id }),
        });
        if (res.ok) applyServerCart(await res.json());
      })();
    },
    [applyServerCart],
  );

  const removeFromCart = useCallback(
    (id: string) => {
      mutatedRef.current = true;
      setCart((prev) => prev.filter((i) => i.id !== id));
      (async () => {
        const res = await fetch(`/api/cart/items/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (res.ok) applyServerCart(await res.json());
      })();
    },
    [applyServerCart],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      mutatedRef.current = true;
      setCart((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, Math.min(quantity, item.totalStock)) }
            : item,
        ),
      );
      (async () => {
        const res = await fetch(`/api/cart/items/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) applyServerCart(await res.json());
      })();
    },
    [applyServerCart],
  );

  const clearCart = useCallback(() => {
    mutatedRef.current = true;
    setCart([]);
    setCouponCode(null);
    setDiscountPercent(0);
    // Belt and braces: the server also clears the cart when an order is
    // written (createOrderDb), so a dropped request here can't resurrect
    // already-bought items on the next visit.
    fetch("/api/cart", { method: "DELETE" }).catch(() => {});
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const res = await fetch("/api/cart/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) return { ok: false, message: body.message as string | undefined };
    applyServerCart(body.cart as ServerCart);
    setCouponWarning(null);
    return { ok: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setDiscountPercent(0);
    fetch("/api/cart/coupon", { method: "DELETE" }).catch(() => {});
  }, []);

  const dismissCouponWarning = useCallback(() => setCouponWarning(null), []);

  const setSelectedAddressId = useCallback((id: string) => {
    setSelectedAddressIdState(id);
    try {
      localStorage.setItem(ADDRESS_ID_KEY, id);
    } catch {
      /* unavailable storage */
    }
  }, []);

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount,
      subtotal,
      hydrated,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      couponCode,
      discountPercent,
      applyCoupon,
      removeCoupon,
      couponWarning,
      dismissCouponWarning,
      selectedAddressId,
      setSelectedAddressId,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
    }),
    [
      cart,
      cartCount,
      subtotal,
      hydrated,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      couponCode,
      discountPercent,
      applyCoupon,
      removeCoupon,
      couponWarning,
      dismissCouponWarning,
      selectedAddressId,
      setSelectedAddressId,
      isCartOpen,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
