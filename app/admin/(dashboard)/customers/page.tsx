import { prisma } from "@/app/server/prisma";
import { formatPrice } from "@/app/components-home/lib/format";
import { TableCard, Th, Td, EmptyRow } from "../ui";
import AdminPageHeader from "../PageHeader";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function AdminCustomersPage() {
  const [users, guests] = await Promise.all([
    prisma.user.findMany({
      include: { orders: { select: { total: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guestCustomer.findMany({
      include: { orders: { select: { total: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows = [
    ...users.map((user) => ({
      id: user.id,
      name: user.name,
      contact: user.email,
      phone: user.phone ?? "—",
      type: user.isAdmin ? "Admin" : "Registered",
      createdAt: user.createdAt,
      orderCount: user.orders.length,
      spend: user.orders.reduce((sum, order) => sum + order.total, 0),
    })),
    ...guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      contact: guest.email ?? "—",
      phone: guest.phone,
      type: "Guest",
      createdAt: guest.createdAt,
      orderCount: guest.orders.length,
      spend: guest.orders.reduce((sum, order) => sum + order.total, 0),
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Customers" }]}
        title="Customers"
        description={`${users.length} registered · ${guests.length} guest`}
      />

      <TableCard>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Type</Th>
            <Th>Joined</Th>
            <Th className="text-right">Orders</Th>
            <Th className="text-right">Total spend</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={7}>No customers yet.</EmptyRow>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <Td className="font-semibold">{row.name}</Td>
                <Td className="text-slate-600">{row.contact}</Td>
                <Td className="text-slate-600">{row.phone}</Td>
                <Td>
                  <span className="text-nano font-semibold text-slate-500">{row.type}</span>
                </Td>
                <Td className="whitespace-nowrap text-slate-500">{dateFormatter.format(row.createdAt)}</Td>
                <Td className="text-right tabular-nums">{row.orderCount}</Td>
                <Td className="text-right tabular-nums">{formatPrice(row.spend)}</Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
