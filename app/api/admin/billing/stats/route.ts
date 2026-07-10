import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/billing/stats?range=7d|30d|90d|year|all
export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const range = new URL(req.url).searchParams.get("range") || "30d";
  const now = new Date();
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

  let days = 30;
  if (range === "7d") days = 7;
  else if (range === "30d") days = 30;
  else if (range === "90d") days = 90;
  else if (range === "year") days = 365;
  else if (range === "all") days = 3650;

  const rangeStart = startOfDay(new Date(now.getTime() - (days - 1) * 86400000));

  // Only completed invoices count toward revenue
  const invoices = await Invoice.find({ status: "completed" }).sort({ createdAt: 1 }).lean();

  const todayStart = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let todaySales = 0, todayCount = 0, monthSales = 0, totalSales = 0;
  const methodTotals: Record<string, number> = { cash: 0, card: 0, upi: 0, credit: 0, split: 0 };
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  const dayMap: Record<string, { sales: number; count: number }> = {};

  // seed the day buckets so gaps render as zero
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart.getTime() + i * 86400000);
    dayMap[d.toISOString().slice(0, 10)] = { sales: 0, count: 0 };
  }

  for (const inv of invoices) {
    const created = new Date(inv.createdAt as Date);
    totalSales += inv.grandTotal;
    if (created >= todayStart) { todaySales += inv.grandTotal; todayCount++; }
    if (created >= monthStart) monthSales += inv.grandTotal;
    methodTotals[inv.paymentMethod] = (methodTotals[inv.paymentMethod] || 0) + inv.grandTotal;

    if (created >= rangeStart) {
      const key = created.toISOString().slice(0, 10);
      if (dayMap[key]) { dayMap[key].sales += inv.grandTotal; dayMap[key].count++; }
    }
    for (const it of inv.items || []) {
      const k = it.productId ? String(it.productId) : it.name;
      if (!productMap[k]) productMap[k] = { name: it.name, qty: 0, revenue: 0 };
      productMap[k].qty += it.quantity;
      productMap[k].revenue += it.lineTotal;
    }
  }

  const series = Object.entries(dayMap).map(([date, v]) => ({ date, sales: v.sales, count: v.count }));
  const totalInvoices = invoices.length;
  const rangeSales = series.reduce((s, d) => s + d.sales, 0);
  const rangeCount = series.reduce((s, d) => s + d.count, 0);
  const avgBill = totalInvoices ? Math.round(totalSales / totalInvoices) : 0;

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const paymentBreakdown = Object.entries(methodTotals)
    .filter(([, v]) => v > 0)
    .map(([method, amount]) => ({ method, amount }));

  const recent = [...invoices].reverse().slice(0, 8);

  return Response.json({
    success: true,
    data: {
      todaySales, todayCount, monthSales, totalSales, totalInvoices, avgBill,
      rangeSales, rangeCount, rangeDays: days,
      series, topProducts, paymentBreakdown,
      recent,
    },
  });
}
