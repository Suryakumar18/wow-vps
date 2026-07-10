'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader2, FileText, FileSpreadsheet, Eye, Zap } from 'lucide-react';
import BillingShell from '../BillingShell';
import { exportExcel, exportTablePDF } from '../exporters';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');

function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (method !== 'all') qs.set('method', method);
    if (status !== 'all') qs.set('status', status);
    fetch(`/api/admin/billing/invoices?${qs}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setInvoices(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search, method, status]);

  const summary = useMemo(() => ({
    total: invoices.reduce((s, i) => s + (i.grandTotal || 0), 0),
    count: invoices.length,
  }), [invoices]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const cols = ['Invoice', 'Date', 'Customer', 'Phone', 'Method', 'Status', 'Total (₹)'];
  const rows = () => invoices.map(i => [
    i.invoiceNumber, fmtDate(i.createdAt), i.customer?.name || '', i.customer?.phone || '', i.paymentMethod, i.paymentStatus, i.grandTotal,
  ]);
  const exportXls = () => exportExcel(`invoices-${Date.now()}`, cols, rows(), 'WOW Lifestyle — Invoices');
  const exportPDF = () => exportTablePDF({
    title: 'Invoices', subtitle: `${invoices.length} invoices · Total ₹${summary.total.toLocaleString('en-IN')}`,
    columns: cols, rows: rows(), align: ['left', 'left', 'left', 'left', 'left', 'left', 'right'],
  });

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Invoices</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{summary.count} invoices · ₹{summary.total.toLocaleString('en-IN')} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportXls} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-[12.5px] font-semibold hover:bg-green-100 transition-colors">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[12.5px] font-semibold text-gray-600 hover:border-gray-300 transition-colors">
            <FileText size={14} /> PDF
          </button>
          <Link href="/admin/billing/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 transition-colors">
            <Zap size={14} /> New Bill
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bcard p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="bfield" style={{ paddingLeft: 34, height: 42 }} placeholder="Search invoice #, customer, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bfield" style={{ width: 140, height: 42 }} value={method} onChange={e => setMethod(e.target.value)}>
          <option value="all">All methods</option><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="credit">Credit</option>
        </select>
        <select className="bfield" style={{ width: 140, height: 42 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All status</option><option value="completed">Completed</option><option value="held">Held</option><option value="cancelled">Cancelled</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bcard overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={26} className="animate-spin text-indigo-600" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <FileText size={34} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="btable">
              <thead>
                <tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Method</th><th>Payment</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <motion.tr key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                    <td><Link href={`/admin/billing/invoices/${inv._id}`} className="font-bold text-gray-900 hover:text-indigo-600">{inv.invoiceNumber}</Link></td>
                    <td className="whitespace-nowrap">{fmtDate(inv.createdAt)}</td>
                    <td>
                      <div className="font-medium text-gray-800">{inv.customer?.name}</div>
                      {inv.customer?.phone && <div className="text-[11px] text-gray-400">{inv.customer.phone}</div>}
                    </td>
                    <td className="capitalize">{inv.paymentMethod}</td>
                    <td><span className={`pill pill-${inv.paymentStatus}`}>{inv.paymentStatus}</span></td>
                    <td style={{ textAlign: 'right' }} className="font-bold text-gray-900 whitespace-nowrap">₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                    <td>
                      <Link href={`/admin/billing/invoices/${inv._id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"><Eye size={14} /></Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default function InvoicesPage() {
  return <BillingShell><Invoices /></BillingShell>;
}
