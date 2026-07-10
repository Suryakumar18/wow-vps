'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Minus, Trash2, Zap, Loader2, CheckCircle2, Printer,
  User, Banknote, CreditCard, Smartphone, Clock, X, Keyboard,
} from 'lucide-react';

const API = '/api';

interface Product { _id: string; title: string; brand: string; price: number; images?: string[]; totalStock?: number; category?: string; }
interface CartItem { productId?: string; name: string; sku: string; price: number; quantity: number; discountPct: number; taxPct: number; }

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token')?.replace(/['"]+/g, '') || '' : '');
const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN')}`;

const PAY_METHODS = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'upi',  label: 'UPI',  icon: Smartphone },
  { key: 'credit', label: 'Credit', icon: Clock },
] as const;

function QuickBill() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [gst, setGst] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState<typeof PAY_METHODS[number]['key']>('cash');
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast, setToast] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Load products + settings ── */
  useEffect(() => {
    fetch(`${API}/admin/products?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : d.data || d.products || []))
      .catch(() => {});
    fetch(`${API}/admin/billing/settings`)
      .then(r => r.json())
      .then(d => { if (d.success) { setSettings(d.data); setGst(d.data.defaultTaxPct || 0); } })
      .catch(() => {});
    searchRef.current?.focus();
  }, []);

  /* ── Search filter ── */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products.filter(p =>
      p.title?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p._id?.includes(q)
    ).slice(0, 24);
  }, [query, products]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  /* ── Cart ops ── */
  const addToCart = useCallback((p: Product) => {
    setCart(prev => {
      const i = prev.findIndex(c => c.productId === p._id);
      if (i >= 0) {
        const next = [...prev]; next[i] = { ...next[i], quantity: next[i].quantity + 1 }; return next;
      }
      return [...prev, { productId: p._id, name: p.title, sku: p._id.slice(-6).toUpperCase(), price: p.price, quantity: 1, discountPct: 0, taxPct: gst }];
    });
    setToast(`Added ${p.title}`);
    setTimeout(() => setToast(''), 1200);
  }, [gst]);

  const setQty = (idx: number, q: number) =>
    setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, q) } : c));
  const removeLine = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));
  const clearBill = () => { setCart([]); setCustomer({ name: '', phone: '' }); setExtraDiscount(0); setLastInvoice(null); searchRef.current?.focus(); };

  // apply GST change to all lines
  useEffect(() => { setCart(prev => prev.map(c => ({ ...c, taxPct: gst }))); }, [gst]);

  /* ── Totals ── */
  const totals = useMemo(() => {
    let subTotal = 0, itemDiscount = 0, taxAmount = 0;
    cart.forEach(c => {
      const gross = c.price * c.quantity;
      const disc = gross * c.discountPct / 100;
      const taxable = gross - disc;
      subTotal += gross; itemDiscount += disc; taxAmount += taxable * c.taxPct / 100;
    });
    const taxable = subTotal - itemDiscount - extraDiscount;
    const preRound = taxable + taxAmount;
    const grandTotal = Math.round(preRound);
    return { subTotal, itemDiscount, taxAmount, taxable, grandTotal, roundOff: grandTotal - preRound, count: cart.reduce((s, c) => s + c.quantity, 0) };
  }, [cart, extraDiscount]);

  /* ── Save ── */
  const saveBill = useCallback(async () => {
    if (cart.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/billing/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          customer, items: cart, extraDiscount, paymentMethod: payMethod,
          amountPaid: totals.grandTotal, status: 'completed',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setLastInvoice(data.data);
      setToast(`Bill ${data.data.invoiceNumber} saved!`);
    } catch (e: any) {
      setToast(e.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  }, [cart, customer, extraDiscount, payMethod, totals.grandTotal, saving]);

  const printBill = () => {
    if (!lastInvoice) return;
    const inv = lastInvoice;
    const s = settings || {};
    const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const addr = [[s.addressLine1, s.addressLine2].filter(Boolean).join(', '), [s.city, s.state, s.pincode].filter(Boolean).join(', ')].filter(Boolean);
    const items = (inv.items || []).map((it: any) =>
      `<div class="r"><span>${esc(it.name)} x${it.quantity}</span><span>₹${it.lineTotal}</span></div>`).join('');
    const w = window.open('', '_blank', 'width=380,height=640');
    if (!w) { alert('Allow pop-ups to print the receipt.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.invoiceNumber)}</title>
      <style>
        @page { size:80mm auto; margin:0; }
        body { font-family:'Courier New',monospace; width:80mm; margin:0; padding:8px 10px; color:#000; font-size:12px; }
        .c { text-align:center; } .b { font-weight:700; }
        .r { display:flex; justify-content:space-between; }
        .hr { border-top:1px dashed #000; margin:6px 0; }
      </style></head><body>
      <div class="c b" style="font-size:15px">${esc(s.companyName || 'WOW Lifestyle')}</div>
      ${s.tagline ? `<div class="c" style="font-size:10px">${esc(s.tagline)}</div>` : ''}
      ${addr.length ? `<div class="c" style="font-size:9px">${addr.map(esc).join('<br>')}</div>` : ''}
      ${s.phone ? `<div class="c" style="font-size:9px">Ph: ${esc(s.phone)}</div>` : ''}
      ${s.gstin ? `<div class="c" style="font-size:9px">GSTIN: ${esc(s.gstin)}</div>` : ''}
      <div class="hr"></div>
      <div class="r"><span>${esc(inv.invoiceNumber)}</span><span>${new Date(inv.createdAt).toLocaleString('en-IN')}</span></div>
      <div>Customer: ${esc(inv.customer?.name)}</div>
      ${inv.customer?.phone ? `<div>Phone: ${esc(inv.customer.phone)}</div>` : ''}
      <div class="hr"></div>
      ${items}
      <div class="hr"></div>
      <div class="r"><span>Subtotal</span><span>₹${inv.subTotal}</span></div>
      ${inv.itemDiscount > 0 ? `<div class="r"><span>Discount</span><span>-₹${inv.itemDiscount + inv.extraDiscount}</span></div>` : ''}
      ${inv.taxAmount > 0 ? `<div class="r"><span>GST</span><span>₹${inv.taxAmount}</span></div>` : ''}
      <div class="r b" style="font-size:14px"><span>TOTAL</span><span>₹${inv.grandTotal}</span></div>
      <div class="r"><span>Paid (${esc(inv.paymentMethod)})</span><span>₹${inv.amountPaid}</span></div>
      <div class="hr"></div>
      <div class="c" style="font-size:10px">${esc(s.footerNote || 'Thank you for shopping!')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},200);};</script>
      </body></html>`);
    w.document.close();
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'F9') { e.preventDefault(); saveBill(); return; }
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); return; }
      if (e.key === 'F4') { e.preventDefault(); setPayMethod(p => { const idx = PAY_METHODS.findIndex(m => m.key === p); return PAY_METHODS[(idx + 1) % PAY_METHODS.length].key; }); return; }
      if (e.key === 'F6') { e.preventDefault(); clearBill(); return; }
      if (e.key === 'F1') { e.preventDefault(); setShowShortcuts(s => !s); return; }
      if (e.key === 'Escape') { if (showShortcuts) setShowShortcuts(false); else { setQuery(''); (e.target as HTMLElement)?.blur?.(); } return; }

      // search navigation only while focused in the search box
      if (searchRef.current && document.activeElement === searchRef.current) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); const p = results[activeIdx]; if (p) { addToCart(p); setQuery(''); } }
      } else if (!inField && e.key === '/') {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, activeIdx, addToCart, saveBill, showShortcuts]);

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="b-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CheckCircle2 size={17} className="text-emerald-400" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div className="wow-guard-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShortcuts(false)}>
            <motion.div className="wow-guard-modal" style={{ maxWidth: 440 }} initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="wow-guard-title" style={{ margin: 0 }}>Keyboard Shortcuts</h3>
                <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-900"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  ['F2  /  /', 'Focus product search'],
                  ['↑ ↓', 'Move through results'],
                  ['Enter', 'Add highlighted product'],
                  ['F4', 'Switch payment method'],
                  ['F9', 'Save & complete bill'],
                  ['F6', 'Clear / new bill'],
                  ['F1', 'Toggle this help'],
                  ['Esc', 'Clear search'],
                ].map(([k, d]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{d}</span>
                    <span className="kbd">{k}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pos-grid">
        {/* ── LEFT: search + products ── */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="pos-search-wrap">
            <Search size={19} className="pos-search-icon" />
            <input
              ref={searchRef}
              className="pos-search"
              placeholder="Search products by name or brand…  (press / )"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <span className="pos-search-kbd">F2</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {query ? `${results.length} results` : 'Popular products'}
            </span>
            <button onClick={() => setShowShortcuts(true)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600">
              <Keyboard size={14} /> Shortcuts <span className="kbd">F1</span>
            </button>
          </div>

          <div className="pos-results">
            {results.map((p, i) => (
              <button key={p._id} className={`pos-product ${i === activeIdx ? 'active' : ''}`} onClick={() => addToCart(p)}>
                <img className="pos-product-img" src={p.images?.[0] || 'http://200.97.164.140/uploads/brands/wow-logo.svg'} alt={p.title} />
                <div className="pos-product-body">
                  <div className="pos-product-brand">{p.brand}</div>
                  <div className="pos-product-name">{p.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="pos-product-price">{inr(p.price)}</span>
                    <span className="pos-product-stock">stk {p.totalStock ?? 0}</span>
                  </div>
                </div>
              </button>
            ))}
            {results.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400 text-sm">No products match “{query}”.</div>
            )}
          </div>
        </div>

        {/* ── RIGHT: cart / checkout ── */}
        <div className="pos-cart">
          <div className="pos-cart-head">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-600" />
              <span className="font-bold text-gray-900 text-sm">Current Bill</span>
              {totals.count > 0 && <span className="text-xs font-semibold text-white bg-indigo-600 rounded-full px-2 py-0.5">{totals.count}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={clearBill} className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-100">
            <div className="relative col-span-1">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="bfield" style={{ paddingLeft: 30 }} placeholder="Customer" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
            </div>
            <input className="bfield" placeholder="Phone" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
          </div>

          {/* Items */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <Zap size={30} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No items yet</p>
                <p className="text-xs mt-1">Search &amp; click a product, or press <span className="kbd">/</span></p>
              </div>
            ) : cart.map((c, i) => (
              <motion.div key={i} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pos-line">
                <div className="flex-1 min-w-0">
                  <div className="pos-line-name truncate">{c.name}</div>
                  <div className="pos-line-meta">{inr(c.price)} × {c.quantity} = <b className="text-gray-700">{inr(c.price * c.quantity)}</b></div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="pos-qty">
                    <button onClick={() => setQty(i, c.quantity - 1)}><Minus size={12} /></button>
                    <input value={c.quantity} onChange={e => setQty(i, parseInt(e.target.value) || 1)} />
                    <button onClick={() => setQty(i, c.quantity + 1)}><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Totals + pay */}
          <div className="pos-totals">
            <div className="pos-total-row"><span>Subtotal</span><span>{inr(totals.subTotal)}</span></div>
            {totals.itemDiscount > 0 && <div className="pos-total-row"><span>Item discount</span><span>−{inr(totals.itemDiscount)}</span></div>}
            <div className="pos-total-row items-center">
              <span>Extra discount</span>
              <input type="number" className="bfield" style={{ width: 90, height: 30, textAlign: 'right' }} value={extraDiscount || ''} onChange={e => setExtraDiscount(Math.max(0, Number(e.target.value)))} placeholder="0" />
            </div>
            <div className="pos-total-row items-center">
              <span>GST</span>
              <select className="bfield" style={{ width: 90, height: 30 }} value={gst} onChange={e => setGst(Number(e.target.value))}>
                {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </div>
            {totals.taxAmount > 0 && <div className="pos-total-row"><span>Tax</span><span>+{inr(totals.taxAmount)}</span></div>}
            {Math.abs(totals.roundOff) > 0.001 && <div className="pos-total-row"><span>Round off</span><span>{totals.roundOff > 0 ? '+' : ''}{inr(totals.roundOff)}</span></div>}
            <div className="pos-total-row grand"><span>Total</span><span>{inr(totals.grandTotal)}</span></div>

            {/* Payment method */}
            <div className="pos-pay-methods">
              {PAY_METHODS.map(m => (
                <button key={m.key} className={`pos-pay ${payMethod === m.key ? 'active' : ''}`} onClick={() => setPayMethod(m.key)}>
                  <m.icon size={15} />{m.label}
                </button>
              ))}
            </div>

            {lastInvoice ? (
              <div className="flex gap-2">
                <button className="pos-checkout" style={{ background: '#16a34a' }} onClick={printBill}>
                  <Printer size={17} /> Print {lastInvoice.invoiceNumber}
                </button>
                <button className="pos-checkout" style={{ background: '#111827', width: 120 }} onClick={clearBill}>New</button>
              </div>
            ) : (
              <button className="pos-checkout" onClick={saveBill} disabled={cart.length === 0 || saving}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <><Zap size={17} /> Charge {inr(totals.grandTotal)} <span className="pos-checkout-kbd">F9</span></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function QuickBillPage() {
  return <QuickBill />;
}
