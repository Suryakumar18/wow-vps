"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, PartyPopper, X } from "lucide-react";
import Button from "./ui/Button";

interface ActiveOffer {
  id: string;
  title: string;
  percent: number;
  couponCode: string | null;
}

/**
 * Announces the active sitewide offer once per browser per offer: a centred
 * card with the discount, the claimable coupon (one tap to copy) and a
 * straight path to the catalogue. Dismissing it remembers the offer's id, so
 * the same sale never nags — but a NEW offer shows again.
 */
export default function OfferPopup() {
  const router = useRouter();
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offer")
      .then((res) => (res.ok ? res.json() : { offer: null }))
      .then((body: { offer: ActiveOffer | null }) => {
        if (cancelled || !body.offer) return;
        try {
          if (localStorage.getItem(`offer-seen-${body.offer.id}`)) return;
        } catch {
          /* storage unavailable — show it anyway */
        }
        setOffer(body.offer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    if (offer) {
      try {
        localStorage.setItem(`offer-seen-${offer.id}`, "1");
      } catch {
        /* fine */
      }
    }
    setOffer(null);
  };

  const copyCode = async () => {
    if (!offer?.couponCode) return;
    try {
      await navigator.clipboard.writeText(offer.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 px-gutter"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={`${offer.title} — ${offer.percent}% off`}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-[0_24px_60px_-24px_rgba(16,33,53,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close offer"
              className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-ink"
            >
              <X size={17} aria-hidden="true" />
            </button>

            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-50 text-gold-600">
              <PartyPopper size={26} aria-hidden="true" />
            </span>

            <h2 className="mt-4 text-promo font-bold text-ink">{offer.title}</h2>
            <p className="mt-2 text-lead font-bold text-gold-600">{offer.percent}% OFF on everything</p>
            <p className="mt-1.5 text-micro text-slate-500">
              Prices across the store are already reduced — what you see is what you pay.
            </p>

            {offer.couponCode && (
              <button
                type="button"
                onClick={copyCode}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-gold-500 bg-gold-50 px-4 py-2.5 text-ui font-bold tracking-wider text-ink transition-colors hover:bg-gold-100"
              >
                {offer.couponCode}
                {copied ? (
                  <Check size={15} className="text-[#0F7B3F]" aria-hidden="true" />
                ) : (
                  <Copy size={15} className="text-gold-600" aria-hidden="true" />
                )}
              </button>
            )}
            {offer.couponCode && (
              <p className="mt-1 text-nano text-slate-400">
                {copied ? "Copied! Apply it in your cart." : "Tap to copy — apply it in your cart for extra savings."}
              </p>
            )}

            <Button
              onClick={() => {
                dismiss();
                router.push("/category/all");
              }}
              size="md"
              className="mt-5 w-full"
            >
              Shop the Sale
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
