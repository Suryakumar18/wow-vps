"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, Textarea, FormError } from "../ui";
import MediaUploader from "../MediaUploader";

export interface SlideValues {
  id?: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Comma-separated in the form; split into three words on save. */
  scriptWords: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
}

const blank: SlideValues = {
  eyebrow: "",
  titleLine1: "",
  titleLine2: "",
  description: "",
  ctaLabel: "Shop Now",
  ctaHref: "/category/all",
  scriptWords: "Play, Build, Explore",
  imageUrl: "",
  imageAlt: "",
  isActive: true,
};

export default function HeroSlidesEditor({ initial }: { initial: SlideValues[] }) {
  const router = useRouter();
  const [slides, setSlides] = useState<SlideValues[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const update = (index: number, patch: Partial<SlideValues>) =>
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const save = async (index: number) => {
    const slide = slides[index];
    setError(null);

    if (!slide.titleLine1.trim()) return setError("Each slide needs a headline.");
    if (!slide.imageUrl) return setError("Each slide needs an image.");

    setSavingId(slide.id ?? `new-${index}`);
    const payload = {
      ...slide,
      position: index,
      scriptWords: slide.scriptWords
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean)
        .slice(0, 3),
    };

    try {
      const res = await fetch(
        slide.id ? `/api/admin/hero-slides/${slide.id}` : "/api/admin/hero-slides",
        {
          method: slide.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't save that slide.");
        return;
      }
      const saved = await res.json();
      update(index, { id: saved.id });
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (index: number) => {
    const slide = slides[index];
    if (slide.id) {
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn't delete that slide.");
        return;
      }
    }
    setSlides((prev) => prev.filter((_, i) => i !== index));
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h2 className="text-ui font-bold text-ink">Hero carousel</h2>
          <p className="mt-0.5 text-nano text-slate-500">
            {slides.length === 0
              ? "No slides yet — the homepage is showing the built-in default set."
              : `${slides.length} ${slides.length === 1 ? "slide" : "slides"}, shown in this order.`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSlides((prev) => [...prev, { ...blank }])}
        >
          <Plus size={14} aria-hidden="true" />
          Add slide
        </Button>
      </header>

      <div className="flex flex-col gap-5 p-5">
        <AnimatePresence initial={false}>
          {slides.map((slide, index) => (
            <motion.article
              key={slide.id ?? `new-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-line p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                  Slide {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-nano text-slate-500">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) => update(index, { isActive: e.target.checked })}
                      className="h-4 w-4 accent-[#C6A15B]"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Delete slide ${index + 1}`}
                    className="grid h-9 w-9 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-[#B91C1C]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Eyebrow">
                  <Input
                    value={slide.eyebrow}
                    onChange={(e) => update(index, { eyebrow: e.target.value })}
                    placeholder="More Than Just Toys"
                  />
                </Field>
                <Field label="Script words (max 3, comma separated)">
                  <Input
                    value={slide.scriptWords}
                    onChange={(e) => update(index, { scriptWords: e.target.value })}
                    placeholder="Play, Build, Explore"
                  />
                </Field>

                <Field label="Headline line 1">
                  <Input
                    value={slide.titleLine1}
                    onChange={(e) => update(index, { titleLine1: e.target.value })}
                    placeholder="Fuel Your Passion."
                  />
                </Field>
                <Field label="Headline line 2">
                  <Input
                    value={slide.titleLine2}
                    onChange={(e) => update(index, { titleLine2: e.target.value })}
                    placeholder="Live the WOW Life."
                  />
                </Field>

                <Field label="Description" className="md:col-span-2">
                  <Textarea
                    value={slide.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                  />
                </Field>

                <Field label="Button label">
                  <Input
                    value={slide.ctaLabel}
                    onChange={(e) => update(index, { ctaLabel: e.target.value })}
                  />
                </Field>
                <Field label="Button link">
                  <Input
                    value={slide.ctaHref}
                    onChange={(e) => update(index, { ctaHref: e.target.value })}
                    placeholder="/category/all"
                  />
                </Field>

                <Field label="Image alt text" className="md:col-span-2">
                  <Input
                    value={slide.imageAlt}
                    onChange={(e) => update(index, { imageAlt: e.target.value })}
                    placeholder="Describe the photo for screen readers"
                  />
                </Field>

                <div className="md:col-span-2">
                  <p className="mb-1.5 text-micro font-medium text-ink">Slide image</p>
                  <MediaUploader
                    values={slide.imageUrl ? [slide.imageUrl] : []}
                    onChange={(next) => update(index, { imageUrl: next[next.length - 1] ?? "" })}
                    accept="image"
                    folder="banners"
                    label="Upload slide image"
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    size="sm"
                    onClick={() => save(index)}
                    disabled={savingId === (slide.id ?? `new-${index}`)}
                  >
                    {savingId === (slide.id ?? `new-${index}`) ? "Saving…" : "Save slide"}
                  </Button>
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
