import Link from "next/link";
import { prisma } from "@/app/server/prisma";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";
import {
  ORDER_STATUSES,
  ORDER_STATUS_TONE,
  isOrderStatus,
  type AdminOrderStatus,
} from "../../orderStatus";
import { TableCard, Th, Td, EmptyRow } from "../ui";
import AdminPageHeader from "../PageHeader";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const TABS = ["ALL", ...ORDER_STATUSES] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = (status ?? "ALL").toUpperCase();
  const isStatus = isOrderStatus(active);

  const orders = await prisma.order.findMany({
    where: isStatus ? { status: active as AdminOrderStatus } : undefined,
    include: { items: true },
    orderBy: { placedAt: "desc" },
  });

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Orders" }]}
        title="Orders"
        description={`${orders.length} order${orders.length === 1 ? "" : "s"}${isStatus ? ` with status ${active.toLowerCase()}` : ""}`}
      />

      <div className="-mx-gutter mb-4 flex snap-x gap-2 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const selected = active === tab;
          return (
            <Link
              key={tab}
              href={tab === "ALL" ? "/admin/orders" : `/admin/orders?status=${tab}`}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "shrink-0 snap-start rounded-full border px-4 py-2 text-micro font-semibold capitalize transition-colors",
                selected
                  ? "border-gold-500 bg-gold-500 text-navy-900"
                  : "border-line bg-white text-slate-600 hover:border-gold-300",
              )}
            >
              {tab.toLowerCase()}
            </Link>
          );
        })}
      </div>

      <TableCard>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Placed</Th>
            <Th>Customer</Th>
            <Th className="text-right">Items</Th>
            <Th className="text-right">Total</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <EmptyRow colSpan={7}>No orders here yet.</EmptyRow>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <Td>
                  <span className="font-semibold tabular-nums">{order.orderNumber}</span>
                </Td>
                <Td className="whitespace-nowrap">{dateFormatter.format(order.placedAt)}</Td>
                <Td>
                  {order.addressName || order.addressLabel}
                  <span className="mt-0.5 block text-nano text-slate-500">{order.addressPhone}</span>
                </Td>
                <Td className="text-right tabular-nums">
                  {order.items.reduce((n, item) => n + item.quantity, 0)}
                </Td>
                <Td className="text-right tabular-nums">{formatPrice(order.total)}</Td>
                <Td>
                  <span
                    className={cn("text-nano font-semibold capitalize", ORDER_STATUS_TONE[order.status])}
                  >
                    {order.status.toLowerCase()}
                  </span>
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-micro font-semibold text-gold-600 hover:text-gold-700"
                  >
                    View
                  </Link>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
