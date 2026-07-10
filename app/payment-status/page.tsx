'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ShoppingBag, Clock, Home } from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';

function PaymentStatusContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const orderId      = searchParams.get('orderId');
  const { setBuyNowItem } = useCart();

  const [status, setStatus] = useState<'LOADING'|'SUCCESS'|'UPI_PENDING'|'FAILED'>('LOADING');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!orderId) { setStatus('FAILED'); setErrMsg('No Order ID found.'); return; }

    const check = async () => {
      try {
        const res  = await fetch(`/api/payment/status/${orderId}`);
        const data = await res.json();

        if (data.success) {
          setBuyNowItem(null);
          localStorage.removeItem('cart');

          // UPI orders come back with paymentStatus PENDING until admin verifies
          if (data.isUpi || data.status === 'UPI_PENDING') {
            setStatus('UPI_PENDING');
          } else {
            setStatus('SUCCESS');
          }
        } else {
          setStatus('FAILED');
          setErrMsg(data.message || 'Payment verification failed.');
        }
      } catch {
        setStatus('FAILED');
        setErrMsg('Server unreachable. Contact support if amount was deducted.');
      }
    };

    check();
  }, [orderId, setBuyNowItem]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] max-w-md w-full rounded-2xl p-8 text-center">

        {/* Loading */}
        {status === 'LOADING' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={52} className="animate-spin text-[#C9A84C]" />
            <h2 className="text-xl font-bold text-white">Confirming your order…</h2>
            <p className="text-[#555] text-sm">Please wait a moment.</p>
          </div>
        )}

        {/* COD / Online Success */}
        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle size={42} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Order Placed!</h2>
            <p className="text-[#888] text-sm leading-relaxed">
              Thank you for shopping with WOW Lifestyle.<br />
              Your order <span className="font-mono text-[#C9A84C] font-semibold">{orderId}</span> is confirmed.
            </p>
            <div className="mt-2 w-full flex flex-col gap-3">
              <button onClick={() => router.push('/orders')}
                className="w-full py-3.5 rounded-xl bg-[#C9A84C] text-black font-bold uppercase tracking-widest text-sm hover:bg-[#E2BE6A] transition-colors flex items-center justify-center gap-2">
                <ShoppingBag size={17} /> View My Orders
              </button>
              <button onClick={() => router.push('/')}
                className="w-full py-3.5 rounded-xl bg-[#111] border border-[#262626] text-[#888] font-semibold text-sm hover:text-white transition-colors flex items-center justify-center gap-2">
                <Home size={17} /> Back to Home
              </button>
            </div>
          </div>
        )}

        {/* UPI — awaiting verification */}
        {status === 'UPI_PENDING' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
              <Clock size={40} className="text-[#C9A84C]" />
            </div>
            <h2 className="text-2xl font-black text-white">Order Received!</h2>
            <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-xl p-4 text-left w-full">
              <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest mb-2">Order ID</p>
              <p className="font-mono text-white font-semibold text-sm">{orderId}</p>
            </div>
            <p className="text-[#888] text-sm leading-relaxed">
              Your UPI payment is being verified by our team.<br />
              You will receive a confirmation email once verified (usually within 30 minutes).
            </p>
            <div className="mt-1 bg-[#111] border border-[#262626] rounded-xl p-4 w-full text-left space-y-2">
              <p className="text-[#555] text-xs font-semibold uppercase tracking-widest">What happens next?</p>
              <ul className="text-[#888] text-xs space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">1.</span> We verify your UPI transaction ID</li>
                <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">2.</span> You get a confirmation email</li>
                <li className="flex items-start gap-2"><span className="text-[#C9A84C] mt-0.5">3.</span> Your order ships within 1–2 days</li>
              </ul>
            </div>
            <div className="mt-1 w-full flex flex-col gap-3">
              <button onClick={() => router.push('/orders')}
                className="w-full py-3.5 rounded-xl bg-[#C9A84C] text-black font-bold uppercase tracking-widest text-sm hover:bg-[#E2BE6A] transition-colors flex items-center justify-center gap-2">
                <ShoppingBag size={17} /> Track My Orders
              </button>
              <button onClick={() => router.push('/')}
                className="w-full py-3.5 rounded-xl bg-[#111] border border-[#262626] text-[#888] font-semibold text-sm hover:text-white transition-colors flex items-center justify-center gap-2">
                <Home size={17} /> Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Failed */}
        {status === 'FAILED' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle size={42} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Something went wrong</h2>
            <p className="text-[#888] text-sm">{errMsg}</p>
            <div className="mt-1 w-full flex gap-3">
              <button onClick={() => router.push('/checkout')}
                className="flex-1 py-3.5 rounded-xl bg-[#111] border border-[#262626] text-[#888] font-semibold text-sm hover:text-white transition-colors">
                Try Again
              </button>
              <button onClick={() => router.push('/')}
                className="flex-1 py-3.5 rounded-xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#E2BE6A] transition-colors">
                Home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 size={44} className="animate-spin text-[#C9A84C]" />
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
