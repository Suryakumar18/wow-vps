import type { OrderStatus } from "./lib/orders";
import { cn } from "./lib/cn";

const STYLES: Record<OrderStatus, string> = {
  processing: "bg-gold-50 text-gold-700",
  shipped: "bg-sky text-navy-700",
  delivered: "bg-[#E7F5EC] text-[#0F7B3F]",
  // #B91C1C rather than #E23B3B: at nano/bold/uppercase this text needs 4.5:1
  // contrast, which #E23B3B on this tint falls short of (~3.7:1).
  cancelled: "bg-[#FCEBEB] text-[#B91C1C]",
};

const LABELS: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Shared status pill for My Orders and Order Details — one map, two screens. */
export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-nano font-bold uppercase tracking-wide",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
