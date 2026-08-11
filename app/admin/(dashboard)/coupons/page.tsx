import { prisma } from "@/app/server/prisma";
import { formatPrice } from "@/app/components-home/lib/format";
import { TableCard, Th, Td, EmptyRow } from "../ui";
import AdminPageHeader from "../PageHeader";
import CouponCreateForm from "./CouponCreateForm";
import CouponRowActions from "./CouponRowActions";
import OffersManager from "./OffersManager";

export default async function AdminCouponsPage() {
  const [coupons, offers] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { code: "asc" } }),
    prisma.offer.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Offers & Coupons" }]}
        title="Offers & Coupons"
        description={`${offers.length} offer${offers.length === 1 ? "" : "s"} · ${coupons.length} coupon${coupons.length === 1 ? "" : "s"}`}
      />
      <OffersManager
        offers={offers.map((o) => ({
          id: o.id,
          title: o.title,
          percent: o.percent,
          isActive: o.isActive,
          couponCode: o.couponCode,
        }))}
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
