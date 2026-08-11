/**
 * The order statuses, mirroring the `OrderStatus` enum in `schema.prisma`.
 *
 * Declared here rather than imported from Prisma's generated output: that
 * output lives under `app/`, and importing it into a page or client component
 * drags the generated module graph through the bundler, which breaks the
 * render. Keep these values in step with the schema enum.
 */
export const ORDER_STATUSES = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

export const isOrderStatus = (value: string): value is AdminOrderStatus =>
  (ORDER_STATUSES as readonly string[]).includes(value);

/** Text colours per status — the two hexes are the design system's sanctioned danger/success pair. */
export const ORDER_STATUS_TONE: Record<AdminOrderStatus, string> = {
  PROCESSING: "text-gold-700",
  SHIPPED: "text-navy-800",
  DELIVERED: "text-[#0F7B3F]",
  CANCELLED: "text-[#B91C1C]",
};
