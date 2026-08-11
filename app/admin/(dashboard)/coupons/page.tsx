import { prisma } from "@/app/server/prisma";
import { formatPrice } from "@/app/components-home/lib/format";
import { TableCard, Th, Td, EmptyRow } from "../ui";
import AdminPageHeader from "../PageHeader";
import CouponCreateForm from "./CouponCreateForm";
import CouponRowActions from "./CouponRowActions";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Coupons" }]}
        title="Coupons"
        description={`${coupons.length} coupon${coupons.length === 1 ? "" : "s"}`}
      />
      <CouponCreateForm />

      <TableCard>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th className="text-right">Discount</Th>
            <Th className="text-right">Min. order</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 ? (
            <EmptyRow colSpan={5}>No coupons yet.</EmptyRow>
          ) : (
            coupons.map((coupon) => (
              <tr key={coupon.id}>
                <Td className="font-semibold tabular-nums">{coupon.code}</Td>
                <Td className="text-right tabular-nums">{coupon.percentOff}%</Td>
                <Td className="text-right tabular-nums">{formatPrice(coupon.minOrder)}</Td>
                <Td>
                  <span
                    className={
                      coupon.active
                        ? "text-nano font-semibold text-[#0F7B3F]"
                        : "text-nano font-semibold text-slate-400"
                    }
                  >
                    {coupon.active ? "Active" : "Inactive"}
                  </span>
                </Td>
                <Td className="text-right">
                  <CouponRowActions id={coupon.id} code={coupon.code} active={coupon.active} />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}
