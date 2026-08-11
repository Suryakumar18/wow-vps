import Link from "next/link";
import { prisma } from "@/app/server/prisma";
import { formatPrice } from "@/app/components-home/lib/format";
import { ORDER_STATUSES, type AdminOrderStatus } from "../orderStatus";
import { TableCard, Th, Td, Tr, EmptyRow } from "./ui";
import AdminPageHeader from "./PageHeader";
import StatusBadge from "./StatusBadge";
import { TrendChart, BarList, DonutChart, StatCard, type Point } from "./Charts";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

const DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Segment colours for the status donut, in the same order as ORDER_STATUSES. */
const STATUS_COLORS: Record<AdminOrderStatus, string> = {
  PROCESSING: "#C6A15B",
  SHIPPED: "#13293F",
  DELIVERED: "#0F7B3F",
  CANCELLED: "#B91C1C",
};

/** Percentage change, or undefined when there's no baseline to compare against. */
function delta(current: number, previous: number) {
  if (previous <= 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - DAYS * DAY_MS);
  const priorStart = new Date(now.getTime() - 2 * DAYS * DAY_MS);

  const [
    products,
    hiddenProducts,
    categories,
    brands,
    users,
    guests,
    orders,
    revenue,
    byStatus,
    recent,
    lowStock,
    windowOrders,
    priorOrders,
    topProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: false } }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.user.count(),
    prisma.guestCustomer.count(),
    prisma.order.count(),
    // Cancelled orders aren't revenue.
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({ include: { items: true }, orderBy: { placedAt: "desc" }, take: 6 }),
    prisma.product.findMany({
      where: { totalStock: { lte: 10 } },
      orderBy: { totalStock: "asc" },
      take: 6,
      include: { category: true },
    }),
    prisma.order.findMany({
      where: { placedAt: { gte: windowStart }, status: { not: "CANCELLED" } },
      select: { placedAt: true, total: true },
    }),
    prisma.order.findMany({
      where: { placedAt: { gte: priorStart, lt: windowStart }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["titleSnapshot"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
  ]);

  const statusCount = (status: AdminOrderStatus) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;

  // Bucket the window's orders by day so gaps render as zero rather than
  // collapsing the axis.
  const buckets = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(now.getTime() - i * DAY_MS);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }
  for (const order of windowOrders) {
    const key = order.placedAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }

  const revenuePoints: Point[] = [...buckets.entries()].map(([iso, value]) => ({
    label: dayLabel.format(new Date(iso)),
    value,
  }));

  const windowRevenue = windowOrders.reduce((sum, o) => sum + o.total, 0);
  const priorRevenue = priorOrders.reduce((sum, o) => sum + o.total, 0);

  const topPoints: Point[] = topProducts.map((row) => ({
    label: row.titleSnapshot,
    value: row._sum.quantity ?? 0,
  }));

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard" }]}
        title="Dashboard"
        description={`Live figures from the database · last ${DAYS} days`}
      />

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <li>
          <StatCard
            label="Revenue (30d)"
            value={formatPrice(windowRevenue)}
            delta={delta(windowRevenue, priorRevenue)}
            hint="No prior period to compare"
          />
        </li>
        <li>
          <StatCard
            label="Orders (30d)"
            value={String(windowOrders.length)}
            delta={delta(windowOrders.length, priorOrders.length)}
            hint="No prior period to compare"
          />
        </li>
        <li>
          <StatCard label="Customers" value={String(users + guests)} hint={`${guests} guest`} />
        </li>
        <li>
          <StatCard
            label="Lifetime revenue"
            value={formatPrice(revenue._sum.total ?? 0)}
            hint={`${orders} order${orders === 1 ? "" : "s"} all time`}
          />
        </li>
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-xl border border-line bg-white p-5">
          <h2 className="text-ui font-bold text-ink">Revenue</h2>
          <p className="mt-0.5 text-nano text-slate-500">Daily totals, cancelled orders excluded.</p>
          <div className="mt-4">
            <TrendChart points={revenuePoints} formatValue={formatPrice} />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-line bg-white p-5">
          <h2 className="text-ui font-bold text-ink">Orders by status</h2>
          <p className="mt-0.5 text-nano text-slate-500">All time.</p>
          <div className="mt-5">
            <DonutChart
              total={orders}
              centerLabel="orders"
              segments={ORDER_STATUSES.map((status) => ({
                label: status,
                value: statusCount(status),
                color: STATUS_COLORS[status],
              }))}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-ui font-bold text-ink">Best sellers</h2>
            <span className="text-nano text-slate-500">by units sold</span>
          </div>
          <BarList
            points={topPoints}
            formatValue={(v) => `${v} sold`}
            emptyNote="No orders yet — this fills in as products sell."
          />
        </section>

        <section className="min-w-0 rounded-xl border border-line bg-white p-5">
          <h2 className="text-ui font-bold text-ink">Catalogue</h2>
          <p className="mt-0.5 text-nano text-slate-500">What's in the store right now.</p>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            {[
              { label: "Products", value: `${products}${hiddenProducts ? ` (${hiddenProducts} hidden)` : ""}` },
              { label: "Categories", value: String(categories) },
              { label: "Brands", value: String(brands) },
              { label: "Registered customers", value: String(users) },
            ].map((row) => (
              <div key={row.label} className="rounded-lg bg-mist p-3">
                <dt className="text-nano text-slate-500">{row.label}</dt>
                <dd className="mt-1 text-ui font-bold tabular-nums text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-ui font-bold text-ink">Recent Orders</h2>
            <Link href="/admin/orders" className="text-micro font-semibold text-gold-600 hover:text-gold-700">
              View all
            </Link>
          </div>
          <TableCard>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Placed</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <EmptyRow colSpan={4}>No orders yet.</EmptyRow>
              ) : (
                recent.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold tabular-nums text-gold-700 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-500">
                      {dateFormatter.format(order.placedAt)}
                    </Td>
                    <Td className="text-right tabular-nums">{formatPrice(order.total)}</Td>
                    <Td>
                      <StatusBadge status={order.status.toLowerCase()} />
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </TableCard>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-ui font-bold text-ink">Low Stock</h2>
            <Link href="/admin/products?status=low" className="text-micro font-semibold text-gold-600 hover:text-gold-700">
              Manage
            </Link>
          </div>
          <TableCard>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Stock</Th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <EmptyRow colSpan={3}>Nothing running low.</EmptyRow>
              ) : (
                lowStock.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-semibold text-gold-700 hover:underline"
                      >
                        {product.title}
                      </Link>
                    </Td>
                    <Td className="text-slate-500">{product.category.name}</Td>
                    <Td className="text-right">
                      <StatusBadge
                        status={product.totalStock === 0 ? "Out of stock" : `${product.totalStock} left`}
                        tone={product.totalStock === 0 ? "danger" : "warning"}
                      />
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </TableCard>
        </section>
      </div>
    </div>
  );
}
