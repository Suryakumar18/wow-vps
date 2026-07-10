'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IndianRupee, Receipt, TrendingUp, Wallet, Zap, ArrowUpRight, Loader2, FileText,
} from 'lucide-react';
import BillingShell from '../BillingShell';
import { TrendChart, DonutChart, BarList } from '../charts';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');
const inr = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${Math.round(n || 0)}`;

const cardAnim = (d: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } });

function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/billing/stats?range=${range}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, [range]);

  const kpis = [
    { label: "Today's Sales", value: inr(stats?.todaySales || 0), icon: IndianRupee, tint: '#eef2ff', color: '#4f46e5', sub: `${stats?.todayCount || 0} bills today` },
    { label: 'This Month', value: inr(stats?.monthSales || 0), icon: TrendingUp, tint: '#dcfce7', color: '#16a34a', sub: 'month to date' },
    { label: 'Total Revenue', value: inr(stats?.totalSales || 0), icon: Wallet, tint: '#fef3c7', color: '#d97706', sub: `${stats?.totalInvoices || 0} invoices` },
    { label: 'Avg. Bill Value', value: inr(stats?.avgBill || 0), icon: Receipt, tint: '#e0f2fe', color: '#0284c7', sub: 'per invoice' },
  ];

  return (
    <>
      {/* Header */}
      <motion.div {...cardAnim(0)} className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Billing Overview</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Track sales, payments and top products in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {['7d', '30d', '90d', 'year'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {r === 'year' ? '1Y' : r.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/admin/billing/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 transition-colors">
            <Zap size={14} /> New Bill
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            {kpis.map((k, i) => (
              <motion.div key={k.label} {...cardAnim(0.05 + i * 0.06)} className="kpi">
                <div className="flex items-center justify-between mb-4">
                  <div className="kpi-icon" style={{ background: k.tint, color: k.color }}><k.icon size={18} /></div>
                  <ArrowUpRight size={15} className="text-gray-300" />
                </div>
                <div className="kpi-value mb-1">{k.value}</div>
                <div className="kpi-label mb-1">{k.label}</div>
                <div className="text-[11px] text-gray-400">{k.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Trend + donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <motion.div {...cardAnim(0.3)} className="lg:col-span-2 bcard p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="kpi-label mb-1">Sales Trend</div>
                  <div className="text-2xl font-black text-gray-900">{inr(stats?.rangeSales || 0)}</div>
                </div>
                <span className="text-xs text-gray-400">{stats?.rangeCount || 0} bills · {stats?.rangeDays}d</span>
              </div>
              <TrendChart series={stats?.series || []} />
            </motion.div>

            <motion.div {...cardAnim(0.36)} className="bcard p-6">
              <div className="kpi-label mb-4">Payment Methods</div>
              {stats?.paymentBreakdown?.length ? (
                <DonutChart data={stats.paymentBreakdown.map((p: any) => ({ label: p.method, value: p.amount }))} />
              ) : <p className="text-sm text-gray-400 py-10 text-center">No payments yet</p>}
            </motion.div>
          </div>

          {/* Top products + recent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div {...cardAnim(0.42)} className="bcard p-6">
              <div className="kpi-label mb-4">Top Products</div>
              {stats?.topProducts?.length ? (
                <BarList data={stats.topProducts.map((p: any) => ({ label: p.name, value: p.revenue, sub: `${p.qty} sold` }))} />
              ) : <p className="text-sm text-gray-400 py-10 text-center">No sales yet</p>}
            </motion.div>

            <motion.div {...cardAnim(0.48)} className="lg:col-span-2 bcard overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="kpi-label">Recent Invoices</div>
                <Link href="/admin/billing/invoices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View all →</Link>
              </div>
              {stats?.recent?.length ? (
                <table className="btable">
                  <thead><tr><th>Invoice</th><th>Customer</th><th>Method</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                  <tbody>
                    {stats.recent.map((inv: any) => (
                      <tr key={inv._id}>
                        <td><Link href={`/admin/billing/invoices/${inv._id}`} className="font-semibold text-gray-900 hover:text-indigo-600">{inv.invoiceNumber}</Link></td>
                        <td>{inv.customer?.name}</td>
                        <td><span className="pill pill-completed">{inv.paymentMethod}</span></td>
                        <td style={{ textAlign: 'right' }} className="font-bold text-gray-900">₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={30} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No invoices yet — create your first bill.</p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </>
  );
}

export default function BillingDashboardPage() {
  return <BillingShell><Dashboard /></BillingShell>;
}
