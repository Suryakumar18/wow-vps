"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, FormError } from "../ui";
import MediaUploader from "../MediaUploader";

export interface TileValues {
  id: string;
  slug: string;
  name: string;
  shortTitle: string;
  titleLine1: string;
  titleLine2: string;
  imageUrl: string;
  imageAlt: string;
  showOnHome: boolean;
}

/**
 * Edits the "Discover What Excites You" tiles.
 *
 * These live on the Category rows themselves rather than in a separate table,
 * so a tile can never drift out of sync with the department it links to.
 */
export default function CategoryTilesEditor({ initial }: { initial: TileValues[] }) {
  const router = useRouter();
  const [tiles, setTiles] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<TileValues>) =>
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const save = async (tile: TileValues, index: number) => {
    setError(null);
    setBusyId(tile.id);
    try {
      const res = await fetch(`/api/admin/categories/${tile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortTitle: tile.shortTitle,
          titleLine1: tile.titleLine1,
          titleLine2: tile.titleLine2,
          imageUrl: tile.imageUrl,
          imageAlt: tile.imageAlt,
          showOnHome: tile.showOnHome,
          position: index,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't save that tile.");
        return;
      }
      setSavedId(tile.id);
      setTimeout(() => setSavedId(null), 2000);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusyId(null);
    }
  };

  const shown = tiles.filter((t) => t.showOnHome).length;

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="border-b border-line p-5">
        <p className="text-nano text-slate-500">
          {shown} of {tiles.length} categories shown on the homepage. Tiles come from your
          departments, so a tile always links somewhere real.
        </p>
      </header>

      <div className="flex flex-col gap-5 p-5">
        {tiles.map((tile, index) => (
          <motion.article
            key={tile.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
            className="rounded-lg border border-line p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {tile.imageUrl && (
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
                    <Image src={tile.imageUrl} alt="" fill sizes="44px" className="object-cover" unoptimized />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-micro font-bold text-ink">{tile.name}</p>
                  <p className="truncate text-nano text-slate-500">/category/{tile.slug}</p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-nano text-slate-500">
                <input
                  type="checkbox"
                  checked={tile.showOnHome}
                  onChange={(e) => update(tile.id, { showOnHome: e.target.checked })}
                  className="h-4 w-4 accent-[#C6A15B]"
                />
                Show on homepage
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Short title (mobile tiles)">
                <Input
                  value={tile.shortTitle}
                  onChange={(e) => update(tile.id, { shortTitle: e.target.value })}
                  placeholder="RC Cars"
                />
              </Field>
              <Field label="Image alt text">
                <Input
                  value={tile.imageAlt}
                  onChange={(e) => update(tile.id, { imageAlt: e.target.value })}
                />
              </Field>

              <Field label="Title line 1">
                <Input
                  value={tile.titleLine1}
                  onChange={(e) => update(tile.id, { titleLine1: e.target.value })}
                  placeholder="RC Cars"
                />
              </Field>
              <Field label="Title line 2">
                <Input
                  value={tile.titleLine2}
                  onChange={(e) => update(tile.id, { titleLine2: e.target.value })}
                  placeholder="& Vehicles"
                />
              </Field>

              <div className="md:col-span-2">
                <p className="mb-1.5 text-micro font-medium text-ink">Tile image</p>
                <MediaUploader
                  values={tile.imageUrl ? [tile.imageUrl] : []}
                  onChange={(next) => update(tile.id, { imageUrl: next[next.length - 1] ?? "" })}
                  accept="image"
                  folder="categories"
                  label="Upload tile image"
                />
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <Button size="sm" onClick={() => save(tile, index)} disabled={busyId === tile.id}>
                  {busyId === tile.id ? "Saving…" : "Save tile"}
                </Button>
                {savedId === tile.id && (
                  <span className="flex items-center gap-1.5 text-nano font-semibold text-[#0F7B3F]">
                    <Check size={13} aria-hidden="true" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </motion.article>
        ))}

        <FormError>{error}</FormError>
      </div>
    </section>
  );
}
