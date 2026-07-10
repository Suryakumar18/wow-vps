'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ShieldCheck, CheckCircle,
  Plus, Minus, Trash2, Loader2, AlertCircle,
  Smartphone, Copy, Check, Truck,
} from 'lucide-react';
import Image from 'next/image';
import { CartProvider, useCart } from '@/app/components-main/CartContext';

// ─── UPI config ───────────────────────────────────────────────────────────────
const UPI_ID   = "suryareigns18@okicici";
const UPI_NAME = "WOW Lifestyle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string; title: string; price: number; quantity: number;
  image: string; totalStock: number;
}
interface AddressData {
  country: string; firstName: string; lastName: string;
  address: string; apartment: string; city: string;
  state: string; pinCode: string; phone: string;
}

// ─── Address form (kept outside to avoid focus loss) ─────────────────────────
const AddressForm = ({
  data, onChange, inputClass,
}: { data: AddressData; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; inputClass: string; }) => (
  <div className="space-y-4">
    <select name="country" value={data.country} onChange={onChange} className={inputClass}>
      <option value="India">India</option>
    </select>
    <div className="grid grid-cols-2 gap-4">
      <input type="text" name="firstName"  value={data.firstName}  onChange={onChange} placeholder="First name *"  required className={inputClass} />
      <input type="text" name="lastName"   value={data.lastName}   onChange={onChange} placeholder="Last name *"   required className={inputClass} />
    </div>
    <input type="text" name="address"   value={data.address}   onChange={onChange} placeholder="Address *"                required className={inputClass} />
    <input type="text" name="apartment" value={data.apartment} onChange={onChange} placeholder="Apartment / suite (optional)"         className={inputClass} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input type="text" name="city"    value={data.city}    onChange={onChange} placeholder="City *"     required className={inputClass} />
      <select            name="state"   value={data.state}   onChange={onChange}                                    className={inputClass}>
        {["Tamil Nadu","Karnataka","Kerala","Maharashtra","Andhra Pradesh","Telangana","Goa","Delhi","Gujarat","Rajasthan","Uttar Pradesh","West Bengal"].map(s => <option key={s}>{s}</option>)}
      </select>
      <input type="text" name="pinCode" value={data.pinCode} onChange={onChange} placeholder="PIN code *" required className={inputClass} />
    </div>
    <input type="tel" name="phone" value={data.phone} onChange={onChange} placeholder="Phone *" required className={inputClass} />
  </div>
);

// ─── Main checkout ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, buyNowItem, setBuyNowItem, addToCart, decreaseQuantity, removeFromCart } = useCart() as any;

  const [theme,               setTheme]               = useState<'dark'|'light'>('dark');
  const [paymentMethod,       setPaymentMethod]       = useState<'upi'|'cod'>('upi');
  const [billingSame,         setBillingSame]         = useState(true);
  const [isProcessing,        setIsProcessing]        = useState(false);
  const [transactionId,       setTransactionId]       = useState('');
  const [copiedUpi,           setCopiedUpi]           = useState(false);
  const [toast,               setToast]               = useState<{show:boolean;msg:string;type:'error'|'success'}>({show:false,msg:'',type:'error'});
  const [contactEmail,        setContactEmail]        = useState('');
  const [shippingAddress,     setShippingAddress]     = useState<AddressData>({ country:'India', firstName:'', lastName:'', address:'', apartment:'', city:'', state:'Tamil Nadu', pinCode:'', phone:'' });
  const [billingAddress,      setBillingAddress]      = useState<AddressData>({ country:'India', firstName:'', lastName:'', address:'', apartment:'', city:'', state:'Tamil Nadu', pinCode:'', phone:'' });

  // Theme sync
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) setTheme(e.detail as any); };
    window.addEventListener('theme-change', handler as EventListener);
    const t = document.documentElement.getAttribute('data-theme') as any;
    if (t) setTheme(t);
    return () => window.removeEventListener('theme-change', handler as EventListener);
  }, []);

  // Pre-fill email from logged-in user
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u?.email) setContactEmail(u.email);
    } catch {}
  }, []);

  const items    = buyNowItem ? [buyNowItem] : cart;
  const subtotal = items.reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0);

  // ── UPI QR code URL (dynamic — encodes amount into the QR) ───────────────
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${subtotal}&cu=INR&tn=${encodeURIComponent('WOW Lifestyle Order')}`;
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=230x230&color=000000&bgcolor=ffffff&data=${encodeURIComponent(upiUrl)}&margin=10`;

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  const showToast = (msg: string, type: 'error'|'success' = 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3500);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const shippingOk = contactEmail.trim() && shippingAddress.firstName && shippingAddress.lastName
    && shippingAddress.address && shippingAddress.city && shippingAddress.pinCode && shippingAddress.phone;
  const billingOk  = billingSame || (billingAddress.firstName && billingAddress.address && billingAddress.city && billingAddress.pinCode && billingAddress.phone);
  const upiOk      = paymentMethod !== 'upi' || transactionId.trim().length >= 6;
  const formOk     = shippingOk && billingOk && upiOk;

  // ── Cart handlers ─────────────────────────────────────────────────────────
  const handleIncrease = (item: CartItem) => {
    if (item.quantity >= item.totalStock) { showToast('Maximum stock reached', 'error'); return; }
    buyNowItem ? setBuyNowItem({ ...buyNowItem, quantity: buyNowItem.quantity + 1 }) : addToCart(item);
  };
  const handleDecrease = (item: CartItem) => {
    if (buyNowItem) { buyNowItem.quantity > 1 ? setBuyNowItem({ ...buyNowItem, quantity: buyNowItem.quantity - 1 }) : setBuyNowItem(null); }
    else decreaseQuantity(item.id);
  };
  const handleRemove = (item: CartItem) => {
    buyNowItem ? setBuyNowItem(null) : removeFromCart(item.id);
  };

  // ── Payment submit ─────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!formOk) { showToast('Please fill all required fields' + (paymentMethod === 'upi' ? ' and enter the Transaction ID.' : '.')); return; }
    setIsProcessing(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:          subtotal,
          userId:          userData?._id || userData?.id,
          redirectUrl:     `${window.location.origin}/payment-status`,
          cartItems:       items,
          contactEmail,
          shippingAddress,
          billingAddress:  billingSame ? shippingAddress : billingAddress,
          paymentMethod,
          transactionId:   paymentMethod === 'upi' ? transactionId.trim() : '',
        }),
      });
      const data = await res.json();

      if (data.success && data.url) {
        if (!buyNowItem) localStorage.removeItem('cart');
        window.location.href = data.url;
      } else {
        showToast(data.message || 'Failed to place order. Try again.', 'error');
        setIsProcessing(false);
      }
    } catch {
      showToast('Server unreachable. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const isDark    = theme === 'dark';
  const inputClass = `w-full p-3.5 rounded-md border text-sm transition-all focus:outline-none ${
    isDark ? 'bg-[#111] border-[#333] text-white focus:border-[#C9A84C] placeholder-gray-600' : 'bg-white border-gray-300 text-black focus:border-amber-500 shadow-sm'
  }`;
  const gold      = isDark ? '#C9A84C' : '#d97706';
  const goldClass = isDark ? 'text-[#C9A84C]' : 'text-amber-600';

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${isDark ? 'bg-[#080808] text-white' : 'bg-white text-black'}`}>
        <p className="text-xl font-bold">Your cart is empty.</p>
        <button onClick={() => router.push('/')} className={`px-8 py-3 rounded-lg font-bold ${isDark ? 'bg-[#C9A84C] text-black' : 'bg-amber-500 text-white'}`}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-[#080808]' : 'bg-white'}`}>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border text-sm font-medium
              ${isDark ? 'bg-[#0f0f0f] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          >
            {toast.type === 'error'
              ? <AlertCircle size={16} className="text-red-400 shrink-0" />
              : <CheckCircle  size={16} className="text-emerald-400 shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className={`w-full px-6 py-4 border-b flex items-center gap-4 ${isDark ? 'border-[#1e1e1e]' : 'border-gray-200'}`}>
        <button onClick={() => { setBuyNowItem(null); router.back(); }}
          className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-[#C9A84C]' : 'hover:bg-gray-100 text-gray-700'}`}>
          <ChevronLeft size={22} />
        </button>
        <h1 className={`text-xl font-black tracking-widest uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Secure Checkout {buyNowItem ? '· Buy Now' : ''}
        </h1>
        <ShieldCheck size={18} className={`ml-auto ${goldClass}`} />
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-72px)]">

        {/* ── LEFT: form ───────────────────────────────────────────────────────── */}
        <div className="flex-1 p-6 md:p-10 lg:pr-14 order-2 lg:order-1 space-y-10">

          {/* Contact */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${goldClass}`}>Contact</h2>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
              placeholder="Email address *" required className={inputClass} />
          </section>

          {/* Delivery */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${goldClass}`}>Delivery Address</h2>
            <AddressForm data={shippingAddress} onChange={e => setShippingAddress(p => ({ ...p, [e.target.name]: e.target.value }))} inputClass={inputClass} />
          </section>

          {/* Payment method */}
          <section>
            <h2 className={`text-base font-semibold mb-1 ${goldClass}`}>Payment</h2>
            <p className={`text-xs mb-5 ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>All transactions are secure and encrypted.</p>

            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#262626]' : 'border-gray-200'}`}>

              {/* ── UPI option ───────────────────────────────────────────────── */}
              <div className={`border-b transition-colors ${
                paymentMethod === 'upi'
                  ? isDark ? 'bg-[#111] border-[#C9A84C33]' : 'bg-amber-50 border-amber-200'
                  : isDark ? 'bg-[#0d0d0d] border-[#1e1e1e]' : 'bg-white border-gray-200'
              }`}>
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setPaymentMethod('upi')}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'upi' ? `border-[${gold}]` : 'border-gray-500'}`}
                      style={{ borderColor: paymentMethod === 'upi' ? gold : '' }}>
                      {paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full" style={{ background: gold }} />}
                    </div>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Pay via UPI / QR Code</span>
                  </label>
                  <Smartphone size={18} className={goldClass} />
                </div>

                <AnimatePresence>
                  {paymentMethod === 'upi' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className={`mx-4 mb-5 rounded-xl p-5 ${isDark ? 'bg-[#0a0a0a] border border-[#1e1e1e]' : 'bg-white border border-gray-100 shadow-sm'}`}>

                        {/* Step 1 */}
                        <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>
                          Step 1 — Scan & Pay ₹{subtotal.toLocaleString('en-IN')}
                        </p>

                        {/* QR block */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* QR code (dynamic — includes exact amount) */}
                          <div className={`p-3 rounded-xl border shrink-0 ${isDark ? 'bg-white border-[#333]' : 'bg-white border-gray-200'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrSrc}
                              alt="UPI QR Code"
                              width={160} height={160}
                              className="rounded-lg block"
                            />
                          </div>

                          <div className="flex flex-col gap-4 flex-1 w-full">
                            {/* Amount badge */}
                            <div className={`rounded-lg p-3 text-center ${isDark ? 'bg-[#C9A84C0d] border border-[#C9A84C22]' : 'bg-amber-50 border border-amber-200'}`}>
                              <p className={`text-xs ${isDark ? 'text-[#888]' : 'text-gray-500'}`}>Amount to Pay</p>
                              <p className={`text-2xl font-black mt-0.5 ${goldClass}`}>₹{subtotal.toLocaleString('en-IN')}</p>
                            </div>

                            {/* UPI ID copy */}
                            <div className={`rounded-lg p-3 ${isDark ? 'bg-[#111] border border-[#262626]' : 'bg-gray-50 border border-gray-200'}`}>
                              <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>UPI ID</p>
                              <div className="flex items-center justify-between gap-2">
                                <p className={`font-mono text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{UPI_ID}</p>
                                <button onClick={copyUpi}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                                    copiedUpi
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : isDark ? 'bg-[#1a1a1a] text-[#888] hover:text-[#C9A84C] border border-[#2a2a2a]'
                                               : 'bg-white text-gray-500 hover:text-amber-600 border border-gray-200'
                                  }`}>
                                  {copiedUpi ? <><Check size={12} />Copied!</> : <><Copy size={12} />Copy</>}
                                </button>
                              </div>
                            </div>

                            {/* Apps row */}
                            <p className={`text-xs ${isDark ? 'text-[#444]' : 'text-gray-400'}`}>
                              Works with GPay, PhonePe, Paytm, BHIM & all UPI apps
                            </p>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className={`my-5 border-t ${isDark ? 'border-[#1e1e1e]' : 'border-gray-100'}`} />

                        {/* Step 2 — Transaction ID */}
                        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>
                          Step 2 — Enter UPI Transaction ID
                        </p>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={e => setTransactionId(e.target.value)}
                          placeholder="e.g. 435123456789 (from your UPI app)"
                          className={inputClass}
                        />
                        <p className={`mt-2 text-xs ${isDark ? 'text-[#444]' : 'text-gray-400'}`}>
                          After paying, open your UPI app → Transaction History → copy the Transaction ID / UTR number here.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── COD option ───────────────────────────────────────────────── */}
              <div
                className={`p-4 flex items-center cursor-pointer transition-colors ${
                  paymentMethod === 'cod'
                    ? isDark ? 'bg-[#111]' : 'bg-amber-50'
                    : isDark ? 'bg-[#0d0d0d]' : 'bg-white'
                }`}
                onClick={() => setPaymentMethod('cod')}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{ borderColor: paymentMethod === 'cod' ? gold : '#6b7280' }}>
                    {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full" style={{ background: gold }} />}
                  </div>
                  <Truck size={16} className={paymentMethod === 'cod' ? goldClass : isDark ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>
          </section>

          {/* Billing address */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${goldClass}`}>Billing Address</h2>
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#262626]' : 'border-gray-200'}`}>
              <div className={`p-4 border-b cursor-pointer transition-colors ${
                billingSame ? isDark ? 'bg-[#111] border-[#C9A84C33]' : 'bg-amber-50 border-amber-200' : isDark ? 'bg-[#0d0d0d] border-[#1e1e1e]' : 'bg-white border-gray-200'
              }`} onClick={() => setBillingSame(true)}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: billingSame ? gold : '#6b7280' }}>
                    {billingSame && <div className="w-2 h-2 rounded-full" style={{ background: gold }} />}
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Same as shipping address</span>
                </label>
              </div>
              <div className={`p-4 cursor-pointer transition-colors ${!billingSame ? isDark ? 'bg-[#111]' : 'bg-amber-50' : isDark ? 'bg-[#0d0d0d]' : 'bg-white'}`}
                onClick={() => setBillingSame(false)}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: !billingSame ? gold : '#6b7280' }}>
                    {!billingSame && <div className="w-2 h-2 rounded-full" style={{ background: gold }} />}
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Use a different billing address</span>
                </label>
                <AnimatePresence>
                  {!billingSame && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-5">
                        <AddressForm data={billingAddress} onChange={e => setBillingAddress(p => ({ ...p, [e.target.name]: e.target.value }))} inputClass={inputClass} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Validation hint */}
          {!formOk && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={15} />
              {paymentMethod === 'upi' && !transactionId.trim()
                ? 'Please scan the QR code, pay, then enter your Transaction ID above.'
                : 'Please fill in all required fields.'}
            </div>
          )}

          {/* ── Place Order button ──────────────────────────────────────────── */}
          <button
            onClick={handlePlaceOrder}
            disabled={!formOk || isProcessing}
            className={`w-full py-5 font-black uppercase tracking-[.15em] rounded-xl text-base transition-all flex items-center justify-center gap-3
              disabled:opacity-40 disabled:cursor-not-allowed
              ${isDark
                ? 'bg-gradient-to-r from-[#C9A84C] to-[#E2BE6A] text-black hover:shadow-[0_0_28px_rgba(201,168,76,0.35)]'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'}`}
          >
            {isProcessing ? (
              <><Loader2 size={20} className="animate-spin" /> Placing order…</>
            ) : paymentMethod === 'upi' ? (
              <><CheckCircle size={20} /> Confirm UPI Order</>
            ) : (
              <><Truck size={20} /> Place COD Order</>
            )}
          </button>

          <p className={`text-center text-xs pb-10 ${isDark ? 'text-[#333]' : 'text-gray-400'}`}>
            By placing this order you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>

        {/* ── RIGHT: order summary ──────────────────────────────────────────────── */}
        <div className={`lg:w-[440px] p-6 md:p-10 order-1 lg:order-2 border-b lg:border-b-0 lg:border-l ${isDark ? 'bg-[#050505] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'}`}>
          <div className="sticky top-10">
            <h2 className={`text-sm font-semibold uppercase tracking-widest mb-6 ${goldClass}`}>Order Summary</h2>

            {/* Items */}
            <div className="space-y-5 mb-8">
              {items.map((item: CartItem) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className={`relative w-20 h-20 rounded-lg border flex-shrink-0 overflow-hidden ${isDark ? 'bg-[#111] border-[#262626]' : 'bg-white border-gray-200'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.title} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium line-clamp-2 mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item.title}</p>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center rounded-lg border ${isDark ? 'border-[#262626] bg-[#111]' : 'border-gray-200 bg-white'}`}>
                        <button onClick={() => handleDecrease(item)} className={`px-2.5 py-1.5 text-xs transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><Minus size={13}/></button>
                        <span className={`px-2 text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                        <button onClick={() => handleIncrease(item)} disabled={item.quantity >= item.totalStock} className={`px-2.5 py-1.5 text-xs transition-colors disabled:opacity-30 ${isDark ? 'text-gray-400 hover:text-[#C9A84C]' : 'text-gray-500 hover:text-amber-600'}`}><Plus size={13}/></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        <button onClick={() => handleRemove(item)} className={`p-1 transition-colors ${isDark ? 'text-[#333] hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}><Trash2 size={15}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className={`border-t pt-5 space-y-3 ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-[#888]' : 'text-gray-500'}>Subtotal ({items.reduce((s: number, i: CartItem) => s + i.quantity, 0)} items)</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-[#888]' : 'text-gray-500'}>Shipping</span>
                <span className={`text-xs uppercase tracking-wide ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>FREE</span>
              </div>
              {paymentMethod === 'upi' && (
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-[#888]' : 'text-gray-500'}>Payment</span>
                  <span className={`text-xs font-medium ${goldClass}`}>UPI / QR Code</span>
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-[#888]' : 'text-gray-500'}>Payment</span>
                  <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Cash on Delivery</span>
                </div>
              )}
            </div>

            <div className={`flex justify-between items-center mt-5 pt-5 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-[#C9A84C]' : 'text-amber-600'}`}>Total</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xs ${isDark ? 'text-[#555]' : 'text-gray-400'}`}>INR</span>
                <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Security badge */}
            <div className={`mt-6 flex items-center gap-2 justify-center text-xs ${isDark ? 'text-[#333]' : 'text-gray-400'}`}>
              <ShieldCheck size={13} />
              Secured by 256-bit SSL encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
