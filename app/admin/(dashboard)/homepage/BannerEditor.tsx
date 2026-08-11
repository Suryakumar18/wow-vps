"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2 } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, Select, Textarea, FormError } from "../ui";
import MediaUploader from "../MediaUploader";

export interface BannerValues {
  id?: string;
  tone: "DARK" | "LIGHT" | "CREAM";
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
}

export default function BannerEditor({
  placement,
  initial,
  /** Two-line headlines and an eyebrow only apply to the promo pair. */
  showEyebrow = true,
  showSecondLine = true,
  hint,
}: {
  placement: "PROMO" | "LIFESTYLE";
  initial: BannerValues[];
  showEyebrow?: boolean;
  showSecondLine?: boolean;
  hint: string;
}) {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerValues[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const keyOf = (b: BannerValues, i: number) => b.id ?? `new-${i}`;

  const update = (index: number, patch: Partial<BannerValues>) =>
    setBanners((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  const save = async (index: number) => {
    const banner = banners[index];
    setError(null);
    if (!banner.titleLine1.trim()) return setError("Each card needs a headline.");
    if (!banner.imageUrl) return setError("Each card needs an image.");

    setBusy(keyOf(banner, index));
    try {
      const res = await fetch(
        banner.id ? `/api/admin/banners/${banner.id}` : "/api/admin/banners",
        {
          method: banner.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...banner, placement, position: index }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't save that card.");
        return;
      }
      const saved = await res.json();
      update(index, { id: saved.id });
      setSavedId(saved.id);
      setTimeout(() => setSavedId(null), 2000);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (index: number) => {
    const banner = banners[index];
    if (banner.id) {
      const res = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn't delete that card.");
        return;
      }
    }
    setBanners((prev) => prev.filter((_, i) => i !== index));
    router.refresh();
  };

  const add = () =>
    setBanners((prev) => [
      ...prev,
      {
        tone: "DARK",
        eyebrow: "",
        titleLine1: "",
        titleLine2: "",
        description: "",
        ctaLabel: "Explore",
        ctaHref: "/category/all",
        imageUrl: "",
        imageAlt: "",
        isActive: true,
      },
    ]);

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <p className="text-nano text-slate-500">
          {banners.length === 0 ? "No cards yet — the built-in defaults are showing." : hint}
        </p>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus size={14} aria-hidden="true" />
          Add card
        </Button>
      </header>

      <div className="flex flex-col gap-5 p-5">
        <AnimatePresence initial={false}>
          {banners.map((banner, index) => (
            <motion.article
              key={keyOf(banner, index)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-line p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                  Card {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-nano text-slate-500">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) => update(index, { isActive: e.target.checked })}
                      className="h-4 w-4 accent-[#C6A15B]"
                    />
                    Visible
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Delete card ${index + 1}`}
                    className="grid h-9 w-9 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-[#B91C1C]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {showEyebrow && (
                  <Field label="Eyebrow">
                    <Input
                      value={banner.eyebrow}
                      onChange={(e) => update(index, { eyebrow: e.target.value })}
                      placeholder="RC Cars"
                    />
                  </Field>
                )}

                <Field label="Tone">
                  <Select
                    value={banner.tone}
                    onChange={(e) => update(index, { tone: e.target.value as BannerValues["tone"] })}
                  >
                    <option value="DARK">Dark</option>
                    <option value="LIGHT">Light</option>
                    <option value="CREAM">Cream</option>
                  </Select>
                </Field>

                <Field label={showSecondLine ? "Headline line 1" : "Headline"}>
                  <Input
                    value={banner.titleLine1}
                    onChange={(e) => update(index, { titleLine1: e.target.value })}
                    placeholder="Built for Speed."
                  />
                </Field>
                {showSecondLine && (
                  <Field label="Headline line 2">
                    <Input
                      value={banner.titleLine2}
                      onChange={(e) => update(index, { titleLine2: e.target.value })}
                      placeholder="Made for Thrill."
                    />
                  </Field>
                )}

                <Field label="Description" className="md:col-span-2">
                  <Textarea
                    value={banner.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                  />
                </Field>

                <Field label="Button label">
                  <Input
                    value={banner.ctaLabel}
                    onChange={(e) => update(index, { ctaLabel: e.target.value })}
                  />
                </Field>
                <Field label="Button link">
                  <Input
                    value={banner.ctaHref}
                    onChange={(e) => update(index, { ctaHref: e.target.value })}
                    placeholder="/category/rc-cars"
                  />
                </Field>

                <Field label="Image alt text" className="md:col-span-2">
                  <Input
                    value={banner.imageAlt}
                    onChange={(e) => update(index, { imageAlt: e.target.value })}
                    placeholder="Describe the photo for screen readers"
                  />
                </Field>

                <div className="md:col-span-2">
                  <p className="mb-1.5 text-micro font-medium text-ink">Card image</p>
                  <MediaUploader
                    values={banner.imageUrl ? [banner.imageUrl] : []}
                    onChange={(next) => update(index, { imageUrl: next[next.length - 1] ?? "" })}
                    accept="image"
                    folder="banners"
                    label="Upload card image"
                  />
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <Button size="sm" onClick={() => save(index)} disabled={busy === keyOf(banner, index)}>
                    {busy === keyOf(banner, index) ? "Saving…" : "Save card"}
                  </Button>
                  {savedId && savedId === banner.id && (
                    <span className="flex items-center gap-1.5 text-nano font-semibold text-[#0F7B3F]">
                      <Check size={13} aria-hidden="true" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        <FormError>{error}</FormError>
      </div>
    </section>
  );
}
