/**
 * Pagination constants.
 *
 * Deliberately NOT in `Pagination.tsx`: that's a `"use client"` module, and
 * Next turns client-module exports into client references — a plain array
 * imported from one into a server component isn't a real array, so
 * `PAGE_SIZES.includes(...)` throws. Keeping them here lets both sides import
 * the same values.
 */
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
