'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Loader2, Trash2, Ban, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import BillingShell from '../../BillingShell';
import { exportExcel } from '../../exporters';

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');
const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

/* Build a clean, self-contained invoice HTML for print/PDF (no app chrome, no browser header/footer). */
function buildInvoiceHTML(inv: any, s: any): string {
  const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const addr = [
    [s?.addressLine1, s?.addressLine2].filter(Boolean).join(', '),
    [s?.city, s?.state, s?.pincode].filter(Boolean).join(', '),
  ].filter(Boolean);
  const logo = s?.logo
    ? `<img src="${s.logo}" style="width:54px;height:54px;object-fit:contain;border-radius:10px" />`
    : `<div style="width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:900;font-size:26px;display:flex;align-items:center;justify-content:center">₹</div>`;

  const rows = (inv.items || []).map((it: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:600;color:#111827">${esc(it.name)}</td>
      <td style="text-align:right">₹${it.price?.toLocaleString('en-IN')}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">${it.discountPct}%</td>
      ${s?.showTax ? `<td style="text-align:right">${it.taxPct}%</td>` : ''}
      <td style="text-align:right;font-weight:700;color:#111827">₹${it.lineTotal?.toLocaleString('en-IN')}</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.invoiceNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#111827; margin:0; padding:16mm 14mm; font-size:13px; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:26px; }
    .co { display:flex; gap:12px; align-items:center; }
    .co-name { font-size:19px; font-weight:900; }
    .co-sub { font-size:11px; color:#6b7280; }
    .addr { font-size:11px; color:#6b7280; line-height:1.5; margin-top:6px; }
    .inv-title { font-size:26px; font-weight:900; text-align:right; }
    .inv-no { color:#4f46e5; font-weight:700; text-align:right; }
    .badge { display:inline-block; margin-top:6px; padding:3px 10px; border-radius:50px; font-size:11px; font-weight:700; background:#eef2ff; color:#4338ca; text-transform:capitalize; }
    .meta { display:flex; justify-content:space-between; gap:20px; margin-bottom:20px; }
    .label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#9ca3af; margin-bottom:4px; }
    table { width:100%; border-collapse:collapse; margin-bottom:18px; }
    th { background:#f3f4f6; text-transform:uppercase; font-size:10px; letter-spacing:.05em; color:#6b7280; padding:9px 11px; text-align:left; border-bottom:2px solid #e5e7eb; }
    td { padding:9px 11px; border-bottom:1px solid #eee; color:#4b5563; }
    .totals { width:280px; margin-left:auto; }
    .trow { display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#6b7280; }
    .grand { display:flex; justify-content:space-between; padding-top:10px; margin-top:6px; border-top:2px solid #111827; font-size:17px; font-weight:900; color:#111827; }
    .foot { margin-top:34px; padding-top:14px; border-top:1px solid #eee; text-align:center; color:#9ca3af; font-size:11px; }
    .terms { margin-top:8px; font-size:10.5px; color:#9ca3af; }
  </style></head><body>
    <div class="top">
      <div>
        <div class="co">${logo}<div>
          <div class="co-name">${esc(s?.companyName || 'WOW Lifestyle')}</div>
          <div class="co-sub">${esc(s?.tagline || '')}</div>
        </div></div>
        <div class="addr">${addr.map(esc).join('<br>')}${s?.phone ? `<br>Ph: ${esc(s.phone)}` : ''}${s?.email ? ` · ${esc(s.email)}` : ''}${s?.gstin ? `<br>GSTIN: <b>${esc(s.gstin)}</b>` : ''}</div>
      </div>
      <div>
        <div class="inv-title">INVOICE</div>
        <div class="inv-no">${esc(inv.invoiceNumber)}</div>
        <div style="text-align:right"><span class="badge">${esc(inv.status)}</span></div>
      </div>
    </div>
    <div class="meta">
      <div><div class="label">Billed To</div>
        <div style="font-weight:700;color:#111827">${esc(inv.customer?.name)}</div>
        ${inv.customer?.phone ? `<div style="font-size:11px;color:#6b7280">${esc(inv.customer.phone)}</div>` : ''}
        ${inv.customer?.email ? `<div style="font-size:11px;color:#6b7280">${esc(inv.customer.email)}</div>` : ''}
        ${inv.customer?.address ? `<div style="font-size:11px;color:#6b7280">${esc(inv.customer.address)}</div>` : ''}
      </div>
      <div style="text-align:right"><div class="label">Details</div>
        <div style="font-size:11px;color:#6b7280">Date: ${new Date(inv.createdAt).toLocaleString('en-IN')}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:capitalize">Payment: ${esc(inv.paymentMethod)} · ${esc(inv.paymentStatus)}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Item</th><th style="text-align:right">Price</th><th style="text-align:center">Qty</th><th style="text-align:right">Disc%</th>${s?.showTax ? '<th style="text-align:right">Tax%</th>' : ''}<th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="trow"><span>Subtotal</span><span>₹${inv.subTotal?.toLocaleString('en-IN')}</span></div>
      ${inv.itemDiscount > 0 ? `<div class="trow"><span>Item discount</span><span>−₹${inv.itemDiscount?.toLocaleString('en-IN')}</span></div>` : ''}
      ${inv.extraDiscount > 0 ? `<div class="trow"><span>Extra discount</span><span>−₹${inv.extraDiscount?.toLocaleString('en-IN')}</span></div>` : ''}
      ${s?.showTax && inv.taxAmount > 0 ? `<div class="trow"><span>Tax (GST)</span><span>+₹${inv.taxAmount?.toLocaleString('en-IN')}</span></div>` : ''}
      ${Math.abs(inv.roundOff) > 0.001 ? `<div class="trow"><span>Round off</span><span>₹${inv.roundOff}</span></div>` : ''}
      <div class="grand"><span>Grand Total</span><span>₹${inv.grandTotal?.toLocaleString('en-IN')}</span></div>
      <div class="trow" style="margin-top:6px"><span>Paid (${esc(inv.paymentMethod)})</span><span>₹${inv.amountPaid?.toLocaleString('en-IN')}</span></div>
      ${inv.balance > 0 ? `<div class="trow" style="color:#dc2626;font-weight:700"><span>Balance Due</span><span>₹${inv.balance?.toLocaleString('en-IN')}</span></div>` : ''}
    </div>
    <div class="foot">${esc(s?.footerNote || 'Thank you for your business!')}<div class="terms">${esc(s?.termsNote || '')}</div></div>
    <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
  </body></html>`;
}

function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inv, setInv] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/billing/invoices/${id}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch('/api/admin/billing/settings').then(r => r.json()),
    ]).then(([iv, st]) => {
      if (iv.success) setInv(iv.data);
      if (st.success) setSettings(st.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const printPDF = () => {
    const w = window.open('', '_blank', 'width=900,height=800');
    if (!w) { alert('Please allow pop-ups to print / save PDF.'); return; }
    w.document.write(buildInvoiceHTML(inv, settings || {}));
    w.document.close();
  };

  const exportXls = () => {
    const cols = ['#', 'Item', 'Price', 'Qty', 'Disc%', 'Tax%', 'Line Total'];
    const rows = inv.items.map((it: any, i: number) => [i + 1, it.name, it.price, it.quantity, it.discountPct, it.taxPct, it.lineTotal]);
    rows.push(['', '', '', '', '', 'Grand Total', inv.grandTotal]);
    exportExcel(inv.invoiceNumber, cols, rows, `${settings?.companyName || 'WOW Lifestyle'} — ${inv.invoiceNumber}`);
  };

  const cancelInvoice = async () => {
    if (!confirm('Cancel this invoice?')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/billing/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ status: 'cancelled' }) });
    const d = await res.json(); if (d.success) setInv(d.data); setBusy(false);
  };
  const deleteInvoice = async () => {
    if (!confirm('Permanently delete this invoice?')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/billing/invoices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    const d = await res.json(); if (d.success) router.push('/admin/billing/invoices'); else setBusy(false);
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>;
  if (!inv) return <div className="text-center py-24 text-gray-400">Invoice not found. <Link href="/admin/billing/invoices" className="text-indigo-600">Back</Link></div>;

  const addr = [[settings?.addressLine1, settings?.addressLine2].filter(Boolean).join(', '), [settings?.city, settings?.state, settings?.pincode].filter(Boolean).join(', ')].filter(Boolean);

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <Link href="/admin/billing/invoices" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="flex items-center gap-2">
          {inv.status !== 'cancelled' && (
            <button onClick={cancelInvoice} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50"><Ban size={13} /> Cancel</button>
          )}
          <button onClick={deleteInvoice} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"><Trash2 size={13} /> Delete</button>
          <button onClick={exportXls} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"><FileSpreadsheet size={13} /> Excel</button>
          <button onClick={printPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700"><Printer size={14} /> Print / PDF</button>
        </div>
      </div>

      {/* On-screen invoice sheet */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bcard mx-auto" style={{ maxWidth: 820, padding: 40 }}>
        <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              {settings?.logo
                ? <img src={settings.logo} alt="" className="w-12 h-12 object-contain rounded-xl" />
                : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl" style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>₹</div>}
              <div>
                <div className="text-lg font-black text-gray-900">{settings?.companyName || 'WOW Lifestyle'}</div>
                <div className="text-xs text-gray-500">{settings?.tagline}</div>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 leading-relaxed mt-2">
              {addr.map((a, i) => <div key={i}>{a}</div>)}
              {settings?.phone && <div>Ph: {settings.phone}{settings?.email ? ` · ${settings.email}` : ''}</div>}
              {settings?.gstin && <div>GSTIN: <b>{settings.gstin}</b></div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900">INVOICE</div>
            <div className="text-sm font-semibold text-indigo-600">{inv.invoiceNumber}</div>
            <div className="mt-1"><span className={`pill pill-${inv.status}`}>{inv.status}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Billed To</div>
            <div className="text-sm font-bold text-gray-900">{inv.customer?.name}</div>
            {inv.customer?.phone && <div className="text-xs text-gray-500">{inv.customer.phone}</div>}
            {inv.customer?.email && <div className="text-xs text-gray-500">{inv.customer.email}</div>}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Details</div>
            <div className="text-xs text-gray-600">Date: {new Date(inv.createdAt).toLocaleString('en-IN')}</div>
            <div className="text-xs text-gray-600 capitalize">Payment: {inv.paymentMethod} · {inv.paymentStatus}</div>
          </div>
        </div>

        <table className="btable mb-6" style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <thead><tr><th>#</th><th>Item</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Disc%</th>{settings?.showTax !== false && <th style={{ textAlign: 'right' }}>Tax%</th>}<th style={{ textAlign: 'right' }}>Total</th></tr></thead>
          <tbody>
            {inv.items?.map((it: any, i: number) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="font-medium text-gray-800">{it.name}</td>
                <td style={{ textAlign: 'right' }}>{inr(it.price)}</td>
                <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>{it.discountPct}%</td>
                {settings?.showTax !== false && <td style={{ textAlign: 'right' }}>{it.taxPct}%</td>}
                <td style={{ textAlign: 'right' }} className="font-bold text-gray-900">{inr(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <Row label="Subtotal" value={inr(inv.subTotal)} />
            {inv.itemDiscount > 0 && <Row label="Item discount" value={`−${inr(inv.itemDiscount)}`} />}
            {inv.extraDiscount > 0 && <Row label="Extra discount" value={`−${inr(inv.extraDiscount)}`} />}
            {settings?.showTax !== false && inv.taxAmount > 0 && <Row label="Tax (GST)" value={`+${inr(inv.taxAmount)}`} />}
            {Math.abs(inv.roundOff) > 0.001 && <Row label="Round off" value={inr(inv.roundOff)} />}
            <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-gray-900">
              <span className="text-base font-black text-gray-900">Grand Total</span>
              <span className="text-xl font-black text-gray-900">{inr(inv.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1"><span>Paid ({inv.paymentMethod})</span><span>{inr(inv.amountPaid)}</span></div>
            {inv.balance > 0 && <div className="flex justify-between text-xs font-bold text-red-600"><span>Balance Due</span><span>{inr(inv.balance)}</span></div>}
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-gray-100 text-center text-xs text-gray-400">
          <div className="flex items-center justify-center gap-2"><CheckCircle2 size={13} /> {settings?.footerNote || 'Thank you for your business!'}</div>
          {settings?.termsNote && <div className="mt-1 text-[11px]">{settings.termsNote}</div>}
        </div>
      </motion.div>
    </>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm text-gray-600"><span>{label}</span><span className="font-semibold text-gray-800">{value}</span></div>
);

export default function InvoiceDetailPage() {
  return <BillingShell><InvoiceDetail /></BillingShell>;
}
