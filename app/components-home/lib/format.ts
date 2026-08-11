const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/**
 * Formats a rupee amount the Indian way: ₹2,399 (never ₹2,399.00).
 *
 * Lives here rather than in `ProductCard` so server components (the admin
 * tables) can call it — a helper exported from a `"use client"` module can only
 * be used on the client, which is exactly the error that moved it here.
 */
export const formatPrice = (value: number) => `₹${inr.format(value)}`;
