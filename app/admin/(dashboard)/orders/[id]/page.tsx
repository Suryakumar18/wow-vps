import { notFound } from "next/navigation";
import { prisma } from "@/app/server/prisma";
import { formatPrice } from "@/app/components-home/lib/format";
import { TableCard, Th, Td } from "../../ui";
import AdminPageHeader from "../../PageHeader";
import OrderStatusControl from "./OrderStatusControl";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
        title={order.orderNumber}
        description={`Placed ${dateFormatter.format(order.placedAt)}`}
        backHref="/admin/orders"
        actions={<OrderStatusControl id={order.id} current={order.status} />}
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <TableCard>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Line total</Th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <Td>{item.titleSnapshot}</Td>
                  <Td className="text-right tabular-nums">{item.quantity}</Td>
                  <Td className="text-right tabular-nums">{formatPrice(item.priceSnapshot)}</Td>
                  <Td className="text-right tabular-nums">
                    {formatPrice(item.priceSnapshot * item.quantity)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-4">
              <h2 className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                Delivery Address
              </h2>
              <p className="mt-1.5 text-micro font-semibold text-ink">
                {order.addressLabel}
                {order.addressName && (
                  <span className="font-normal text-slate-500"> — {order.addressName}</span>
                )}
              </p>
              <p className="mt-0.5 text-micro text-slate-600">{order.addressLine}</p>
              <p className="mt-0.5 text-nano text-slate-500">{order.addressPhone}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-4">
              <h2 className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">Payment</h2>
              <p className="mt-1.5 text-micro font-semibold text-ink">{order.paymentMethodLabel}</p>
              <p className="mt-0.5 text-nano capitalize text-slate-500">
                {order.deliveryMethod.toLowerCase()} delivery
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-ui font-bold text-ink">Totals</h2>
          <dl className="mt-3 flex flex-col gap-2 text-micro">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium tabular-nums text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-medium tabular-nums text-ink">
                {order.discount > 0 ? `−${formatPrice(order.discount)}` : formatPrice(0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className="font-medium tabular-nums text-ink">
                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-ui font-bold text-ink">Total</dt>
              <dd className="text-promo font-bold tabular-nums text-ink">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
