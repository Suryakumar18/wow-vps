"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2 } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Input, FormError } from "../ui";
import MediaUploader from "../MediaUploader";

export interface ItemRow {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: string;
  imageUrl: string;
  isActive: boolean;
}

/**
 * Edits one flat content group — announcement strips, trust badges, footer
 * socials and so on.
 *
 * Which columns matter varies by group, so rather than guess, every field is
 * shown but only those already carrying a value across the group are given
 * prominence; empty ones stay available for when a group needs them.
 */
export default function ContentGroupEditor({
  group,
  title,
  initial,
}: {
  group: string;
  title: string;
  initial: ItemRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Only surface the fields this group actually uses, so a list of plain
  // labels isn't buried under five empty inputs.
  const uses = {
    sublabel: initial.some((r) => r.sublabel),
    href: initial.some((r) => r.href),
    icon: initial.some((r) => r.icon),
    image: initial.some((r) => r.imageUrl),
  };

  const set = (id: string, patch: Partial<ItemRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: ItemRow) => {
    setError(null);
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/content/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        setError("Couldn't save that item.");
        return;
      }
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusyId(null);
    }
  };

  const add = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, label: "New item" }),
      });
      if (!res.ok) {
        setError("Couldn't add an item.");
        return;
      }
      const created = await res.json();
      setRows((prev) => [
        ...prev,
        {
          id: created.id,
          label: created.label ?? "",
          sublabel: "",
          href: "",
          icon: "",
          imageUrl: "",
          isActive: true,
        },
      ]);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Couldn't delete that item.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  };

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h2 className="text-ui font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-nano text-slate-500">
            {rows.length} {rows.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus size={14} aria-hidden="true" />
          Add
        </Button>
      </header>

      <ul className="flex flex-col gap-3 p-5">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.li
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-lg border border-line p-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-nano font-medium text-slate-500">Label</span>
                  <Input value={row.label} onChange={(e) => set(row.id, { label: e.target.value })} />
                </label>

                {uses.sublabel && (
                  <label className="flex flex-col gap-1">
                    <span className="text-nano font-medium text-slate-500">Description</span>
                    <Input
                      value={row.sublabel}
                      onChange={(e) => set(row.id, { sublabel: e.target.value })}
                    />
                  </label>
                )}

                {uses.href && (
                  <label className="flex flex-col gap-1">
                    <span className="text-nano font-medium text-slate-500">Link</span>
                    <Input value={row.href} onChange={(e) => set(row.id, { href: e.target.value })} />
                  </label>
                )}

                {uses.icon && (
                  <label className="flex flex-col gap-1">
                    <span className="text-nano font-medium text-slate-500">Icon name</span>
                    <Input value={row.icon} onChange={(e) => set(row.id, { icon: e.target.value })} />
                  </label>
                )}

                {uses.image && (
                  <div className="md:col-span-2">
                    <span className="mb-1.5 block text-nano font-medium text-slate-500">Image</span>
                    {row.imageUrl && (
                      <div className="relative mb-2 h-16 w-24 overflow-hidden rounded-md border border-line bg-mist">
                        <Image src={row.imageUrl} alt="" fill sizes="96px" className="object-cover" unoptimized />
                      </div>
                    )}
                    <MediaUploader
                      values={row.imageUrl ? [row.imageUrl] : []}
                      onChange={(next) => set(row.id, { imageUrl: next[next.length - 1] ?? "" })}
                      accept="image"
                      folder="banners"
                      label="Upload image"
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-1.5 text-nano text-slate-500">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(e) => set(row.id, { isActive: e.target.checked })}
                    className="h-4 w-4 accent-[#C6A15B]"
                  />
                  Visible
                </label>

                <div className="flex items-center gap-2">
                  {savedId === row.id && (
                    <span className="flex items-center gap-1 text-nano font-semibold text-[#0F7B3F]">
                      <Check size={12} aria-hidden="true" />
                      Saved
                    </span>
                  )}
                  <Button size="xs" onClick={() => save(row)} disabled={busyId === row.id}>
                    {busyId === row.id ? "Saving…" : "Save"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    aria-label={`Delete ${row.label || "item"}`}
                    className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-[#B91C1C]"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>

        <FormError>{error}</FormError>
      </ul>
    </section>
  );
}
