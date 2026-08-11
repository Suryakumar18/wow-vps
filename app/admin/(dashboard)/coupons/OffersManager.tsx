"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Megaphone, Percent, Plus, Search, Send, Trash2, X } from "lucide-react";
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
  imageUrl: string | null;
  productIds: string[];
}

interface PickedProduct {
  id: string;
  title: string;
}

/**
 * Offers: create one ("Aadi Offer", 18%) for the whole store or a chosen
 * set of products, attach a banner image, switch it live — matching prices
 * drop and the storefront popup appears — and WhatsApp it (banner included)
 * to every customer number the store knows.
 */
export default function OffersManager({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [percent, setPercent] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<PickedProduct[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Debounced product search for the "selected products" scope.
  useEffect(() => {
    if (scope !== "selected" || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/admin/products?q=${encodeURIComponent(query.trim())}&limit=8`)
        .then((res) => (res.ok ? res.json() : { products: [] }))
        .then((body) =>
          setResults(
            (body.products ?? []).map((p: { id: string; title: string }) => ({
              id: p.id,
              title: p.title,
            })),
          ),
        )
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, scope]);

  const uploadBanner = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "banners");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => null);
      if (body?.success && body.url) setImageUrl(body.url as string);
      else setError(body?.message ?? "Banner upload failed — try again.");
    } catch {
      setError("Banner upload failed — check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (scope === "selected" && selected.length === 0) {
      setError("Pick at least one product, or switch back to All products.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          percent: Number(percent),
          couponCode,
          imageUrl,
          productIds: scope === "selected" ? selected.map((p) => p.id) : [],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't create the offer.");
        return;
      }
      setTitle("");
      setPercent("");
      setCouponCode("");
      setImageUrl(null);
      setScope("all");
      setSelected([]);
      setQuery("");
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
            : `${offer.title} is LIVE — ${offer.percent}% off ${offer.productIds.length > 0 ? `on ${offer.productIds.length} selected product${offer.productIds.length === 1 ? "" : "s"}` : "on all products"}.`,
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
      const preview = await fetch(`/api/admin/offers/${offer.id}/broadcast?dryRun=1`, {
        method: "POST",
      }).then((r) => r.json());
      const count = preview?.audience ?? 0;
      if (count === 0) {
        toast.info("No customer numbers found to notify yet.");
        return;
      }
      if (
        !window.confirm(
          `Send this offer${offer.imageUrl ? " (with the banner image)" : ""} on WhatsApp to ${count} customer number${count === 1 ? "" : "s"}?`,
        )
      ) {
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

  const scopeChip = (value: "all" | "selected", label: string) => (
    <button
      type="button"
      onClick={() => setScope(value)}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-nano font-semibold transition-colors",
        scope === value
          ? "border-gold-500 bg-gold-500 text-navy-900"
          : "border-line bg-white text-slate-600 hover:border-gold-300",
      )}
    >
      {label}
    </button>
  );

  return (
    <section className="mb-6 rounded-xl border border-line bg-white p-4">
      <h2 className="flex items-center gap-2 text-ui font-bold text-ink">
        <Megaphone size={16} className="text-gold-600" aria-hidden="true" />
        Offers
      </h2>
      <p className="mt-1 text-nano text-slate-500">
        Run a sale on the whole store or only the products you pick. Switching it on cuts those
        prices everywhere, shows the announcement popup, and Notify Customers sends it (with the
        banner, if added) to every customer number the store knows on WhatsApp.
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
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Banner */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-nano font-semibold text-slate-600 transition-colors hover:border-gold-400 hover:text-ink disabled:opacity-50"
          >
            <ImagePlus size={14} aria-hidden="true" />
            {uploading ? "Uploading…" : imageUrl ? "Change Banner" : "Add Banner Image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadBanner(file);
              e.target.value = "";
            }}
          />
          {imageUrl && (
            <span className="relative inline-block">
              <img
                src={imageUrl}
                alt="Offer banner"
                className="h-12 w-20 rounded-md border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                aria-label="Remove banner"
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-navy-900 text-white"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          )}

          {/* Scope */}
          <span className="ml-auto flex items-center gap-1.5">
            {scopeChip("all", "All products")}
            {scopeChip("selected", "Selected products")}
          </span>
        </div>

        {scope === "selected" && (
          <div className="mt-3 rounded-lg border border-line bg-mist/40 p-3">
            <div className="relative">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products to add…"
                className="pl-9"
              />
            </div>

            {results.length > 0 && (
              <ul className="mt-2 overflow-hidden rounded-lg border border-line bg-white">
                {results
                  .filter((r) => !selected.some((s) => s.id === r.id))
                  .map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected((prev) => [...prev, product]);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-nano text-ink transition-colors hover:bg-gold-50"
                      >
                        <Plus size={12} aria-hidden="true" className="shrink-0 text-gold-600" />
                        <span className="truncate">{product.title}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {selected.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.map((product) => (
                  <span
                    key={product.id}
                    className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-full bg-gold-50 py-1 pl-3 pr-1 text-nano font-semibold text-ink"
                  >
                    <span className="truncate">{product.title}</span>
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => prev.filter((p) => p.id !== product.id))}
                      aria-label={`Remove ${product.title}`}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-white hover:text-ink"
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-nano text-slate-500">
                Search above and tap a product to add it to this offer.
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" size="md" disabled={pending || uploading}>
            {pending ? "Adding…" : "Add Offer"}
          </Button>
          <FormError>{error}</FormError>
        </div>
      </form>

      {offers.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
          {offers.map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center gap-3 py-3">
              {offer.imageUrl ? (
                <img
                  src={offer.imageUrl}
                  alt=""
                  className="h-10 w-16 shrink-0 rounded-md border border-line object-cover"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                  <Percent size={15} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-micro font-semibold text-ink">
                  {offer.title} — {offer.percent}% off{" "}
                  <span className="font-normal text-slate-500">
                    ·{" "}
                    {offer.productIds.length > 0
                      ? `${offer.productIds.length} product${offer.productIds.length === 1 ? "" : "s"}`
                      : "all products"}
                  </span>
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
                  {offer.isActive ? "LIVE" : "Off"}
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
