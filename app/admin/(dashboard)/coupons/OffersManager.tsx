"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Megaphone, Percent, Send, Trash2 } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { cn } from "@/app/components-home/lib/cn";
import { Field, Input, FormError } from "../ui";
import { useToast } from "../Toast";

interface OfferRow {
  id: string;
  title: string;
  percent: number;
  isActive: boolean;
  couponCode: string | null;
}

/**
 * Sitewide offers: create one ("Aadi Offer", 18%), switch it on — every
 * price on the storefront drops by that percent and the announcement popup
 * appears — and blast it to every known customer number on WhatsApp.
 */
export default function OffersManager({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [percent, setPercent] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, percent: Number(percent), couponCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't create the offer.");
        return;
      }
      setTitle("");
      setPercent("");
      setCouponCode("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const toggle = async (offer: OfferRow) => {
    setBusyId(offer.id);
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      if (res.ok) {
        toast.success(
          offer.isActive
            ? `${offer.title} switched off — prices are back to normal.`
            : `${offer.title} is LIVE — all prices now show ${offer.percent}% off.`,
        );
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const broadcast = async (offer: OfferRow) => {
    setBusyId(offer.id);
    try {
      // Count the audience first, then confirm before actually sending.
      const preview = await fetch(`/api/admin/offers/${offer.id}/broadcast?dryRun=1`, {
        method: "POST",
      }).then((r) => r.json());
      const count = preview?.audience ?? 0;
      if (count === 0) {
        toast.info("No customer numbers found to notify yet.");
        return;
      }
      if (!window.confirm(`Send this offer on WhatsApp to ${count} customer number${count === 1 ? "" : "s"}?`)) {
        return;
      }
      const res = await fetch(`/api/admin/offers/${offer.id}/broadcast`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        toast.success(
          `Sent to ${body.sent} of ${body.audience} numbers${body.failed ? ` (${body.failed} failed)` : ""}.`,
        );
      } else {
        toast.error(body?.error ?? "Broadcast failed.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (offer: OfferRow) => {
    if (!window.confirm(`Delete "${offer.title}"?`)) return;
    setBusyId(offer.id);
    try {
      await fetch(`/api/admin/offers/${offer.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-line bg-white p-4">
      <h2 className="flex items-center gap-2 text-ui font-bold text-ink">
        <Megaphone size={16} className="text-gold-600" aria-hidden="true" />
        Sitewide Offers
      </h2>
      <p className="mt-1 text-nano text-slate-500">
        Switch an offer on and every product price drops by that percent, shoppers see the
        announcement popup, and you can WhatsApp it to every customer number the store knows.
      </p>

      <form onSubmit={create} noValidate className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Offer name" className="min-w-[10rem] flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Aadi Offer"
              required
            />
          </Field>
          <Field label="Discount %" className="min-w-[7rem]">
            <Input
              type="number"
              min={1}
              max={90}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="18"
              required
            />
          </Field>
          <Field label="Coupon to show (optional)" className="min-w-[10rem]">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="AADI18"
            />
          </Field>
          <Button type="submit" size="md" disabled={pending} className="shrink-0">
            {pending ? "Adding…" : "Add Offer"}
          </Button>
        </div>
        <FormError>{error}</FormError>
      </form>

      {offers.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
          {offers.map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <Percent size={15} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-micro font-semibold text-ink">
                  {offer.title} — {offer.percent}% off
                  {offer.couponCode && (
                    <span className="ml-2 rounded bg-mist px-1.5 py-0.5 text-nano font-semibold text-slate-600">
                      {offer.couponCode}
                    </span>
                  )}
                </p>
                <p
                  className={cn(
                    "text-nano font-semibold",
                    offer.isActive ? "text-[#0F7B3F]" : "text-slate-400",
                  )}
                >
                  {offer.isActive ? "LIVE — applied to all products" : "Off"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  onClick={() => toggle(offer)}
                  disabled={busyId === offer.id}
                  size="sm"
                  variant={offer.isActive ? "outline" : undefined}
                >
                  {offer.isActive ? "Switch Off" : "Activate"}
                </Button>
                <Button
                  onClick={() => broadcast(offer)}
                  disabled={busyId === offer.id}
                  size="sm"
                  variant="outline"
                >
                  <Send size={13} aria-hidden="true" />
                  Notify Customers
                </Button>
                <button
                  type="button"
                  onClick={() => remove(offer)}
                  disabled={busyId === offer.id}
                  aria-label={`Delete ${offer.title}`}
                  className="grid h-9 w-9 place-items-center rounded-md text-slate-400 transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
