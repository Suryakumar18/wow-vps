'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, FileSpreadsheet, FileText, TrendingUp, Receipt, IndianRupee, Package } from 'lucide-react';
import BillingShell from '../BillingShell';
import { TrendChart, DonutChart, BarList } from '../charts';
import { exportExcel, exportTablePDF } from '../exporters';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');
const inr = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${Math.round(n || 0)}`;
const cardAnim = (d: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.4 } });

function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/billing/stats?range=${range}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch(`/api/admin/billing/invoices?limit=500`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ]).then(([st, iv]) => {
      if (st.success) setStats(st.data);
      if (iv.success) setInvoices(iv.data);
    }).finally(() => setLoading(false));
  }, [range]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const tableCols = ['Date', 'Invoice', 'Customer', 'Phone', 'Items', 'Method', 'Status', 'Total (₹)'];
  const tableRows = invoices.map(i => [
    fmtDate(i.createdAt), i.invoiceNumber, i.customer?.name || '', i.customer?.phone || '',
    i.items?.length || 0, i.paymentMethod, i.paymentStatus, i.grandTotal,
  ]);

  const doExcel = () => exportExcel(`sales-report-${range}`, tableCols, tableRows, `WOW Lifestyle — Sales Report (${range})`);
  const doPDF = () => exportTablePDF({
    title: 'Sales Report', subtitle: `Range: ${range} · ${invoices.length} invoices · Total ₹${(stats?.rangeSales || 0).toLocaleString('en-IN')}`,
    columns: tableCols, rows: tableRows, align: ['left', 'left', 'left', 'left', 'center', 'left', 'left', 'right'],
  });

  const bestDay = stats?.series?.reduce((m: any, d: any) => (d.sales > (m?.sales || 0) ? d : m), null);
  const tiles = [
    { label: 'Revenue', value: inr(stats?.rangeSales || 0), icon: IndianRupee, tint: '#eef2ff', color: '#4f46e5' },
    { label: 'Bills', value: (stats?.rangeCount || 0).toLocaleString(), icon: Receipt, tint: '#dcfce7', color: '#16a34a' },
    { label: 'Avg / Bill', value: inr(stats?.avgBill || 0), icon: TrendingUp, tint: '#fef3c7', color: '#d97706' },
    { label: 'Best Day', value: bestDay ? inr(bestDay.sales) : '—', icon: Package, tint: '#e0f2fe', color: '#0284c7', sub: bestDay ? fmtDate(bestDay.date) : '' },
  ];

  return (
    <>
      <motion.div {...cardAnim(0)} className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Sales performance, payment mix and best sellers.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {['7d', '30d', '90d', 'year'].map(r => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {r === 'year' ? '1Y' : r.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={doExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-[12.5px] font-semibold hover:bg-green-100 transition-colors">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={doPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 transition-colors">
            <FileText size={14} /> PDF
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            {tiles.map((t, i) => (
              <motion.div key={t.label} {...cardAnim(0.05 + i * 0.06)} className="kpi">
                <div className="kpi-icon mb-4" style={{ background: t.tint, color: t.color }}><t.icon size={18} /></div>
                <div className="kpi-value mb-1">{t.value}</div>
                <div className="kpi-label">{t.label}</div>
                {t.sub && <div className="text-[11px] text-gray-400 mt-0.5">{t.sub}</div>}
              </motion.div>
            ))}
          </div>

          <motion.div {...cardAnim(0.3)} className="bcard p-6 mb-5">
            <div className="kpi-label mb-3">Sales Over Time</div>
            <TrendChart series={stats?.series || []} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <motion.div {...cardAnim(0.36)} className="bcard p-6">
              <div className="kpi-label mb-4">Payment Method Split</div>
              {stats?.paymentBreakdown?.length ? (
                <DonutChart data={stats.paymentBreakdown.map((p: any) => ({ label: p.method, value: p.amount }))} />
              ) : <p className="text-sm text-gray-400 py-10 text-center">No data</p>}
            </motion.div>
            <motion.div {...cardAnim(0.42)} className="bcard p-6">
              <div className="kpi-label mb-4">Top Selling Products</div>
              {stats?.topProducts?.length ? (
                <BarList data={stats.topProducts.map((p: any) => ({ label: p.name, value: p.revenue, sub: `${p.qty} sold · ${inr(p.revenue)}` }))} />
              ) : <p className="text-sm text-gray-400 py-10 text-center">No sales yet</p>}
            </motion.div>
          </div>

          {/* Detailed invoices table */}
          <motion.div {...cardAnim(0.48)} className="bcard overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-2">
              <div>
                <div className="kpi-label">Detailed Sales Ledger</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{invoices.length} invoices</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={doExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"><FileSpreadsheet size={13} /> Excel</button>
                <button onClick={doPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300"><FileText size={13} /> PDF</button>
              </div>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
              {invoices.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><Receipt size={30} className="mx-auto mb-3 opacity-40" /><p className="text-sm">No invoices in this range.</p></div>
              ) : (
                <table className="btable">
                  <thead><tr>
                    <th>Date</th><th>Invoice</th><th>Customer</th><th>Phone</th>
                    <th style={{ textAlign: 'center' }}>Items</th><th>Method</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th>
                  </tr></thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <motion.tr key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}>
                        <td className="whitespace-nowrap">{fmtDate(inv.createdAt)}</td>
                        <td><Link href={`/admin/billing/invoices/${inv._id}`} className="font-bold text-gray-900 hover:text-indigo-600">{inv.invoiceNumber}</Link></td>
                        <td className="font-medium text-gray-800">{inv.customer?.name}</td>
                        <td>{inv.customer?.phone || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{inv.items?.length || 0}</td>
                        <td className="capitalize">{inv.paymentMethod}</td>
                        <td><span className={`pill pill-${inv.paymentStatus}`}>{inv.paymentStatus}</span></td>
                        <td style={{ textAlign: 'right' }} className="font-bold text-gray-900 whitespace-nowrap">₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}

export default function ReportsPage() {
  return <BillingShell><Reports /></BillingShell>;
}
