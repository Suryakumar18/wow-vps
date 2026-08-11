"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { cn } from "@/app/components-home/lib/cn";
import { Input } from "../ui";
import ConfirmDialog from "../ConfirmDialog";
import StatusBadge from "../StatusBadge";
import { useToast } from "../Toast";

export interface SubcategoryRow {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

/**
 * Adds and removes the second level under a department.
 *
 * Deleting a subcategory never deletes its products — they fall back to sitting
 * directly under the department, which is why the confirmation says so.
 */
export default function SubcategoryManager({
  categoryId,
  categoryName,
  initial,
}: {
  categoryId: string;
  categoryName: string;
  initial: SubcategoryRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState<SubcategoryRow | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;

    setPending(true);
    try {
      const res = await fetch("/api/admin/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't add that subcategory.");
        return;
      }
      setRows((prev) => [...prev, { id: body.id, name: body.name, slug: body.slug, productCount: 0 }]);
      setDraft("");
      toast.success(`“${name}” added to ${categoryName}.`);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!confirming) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/subcategories/${confirming.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't delete that subcategory.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== confirming.id));
      toast.success(
        body?.releasedProducts
          ? `“${confirming.name}” deleted — ${body.releasedProducts} product(s) moved up to ${categoryName}.`
          : `“${confirming.name}” was deleted.`,
      );
      setConfirming(null);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-micro font-semibold text-gold-700 transition-colors hover:text-gold-600"
      >
        {rows.length === 0 ? "Add subcategories" : `${rows.length} subcategor${rows.length === 1 ? "y" : "ies"}`}
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg border border-line bg-mist/50 p-3">
              {rows.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-3 pr-1"
                    >
                      <span className="text-micro text-ink">{row.name}</span>
                      <StatusBadge
                        status={`${row.productCount}`}
                        tone={row.productCount > 0 ? "info" : "neutral"}
                      />
                      <button
                        type="button"
                        onClick={() => setConfirming(row)}
                        aria-label={`Delete ${row.name}`}
                        className="grid h-6 w-6 place-items-center rounded-full text-slate-400 transition-colors hover:bg-mist hover:text-[#B91C1C]"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={add} className="flex flex-wrap items-center gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`New subcategory in ${categoryName}…`}
                  aria-label={`New subcategory in ${categoryName}`}
                  className="h-10 min-w-0 flex-1"
                />
                <Button type="submit" size="sm" disabled={pending || !draft.trim()}>
                  <Plus size={14} aria-hidden="true" />
                  Add
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete subcategory"
        description={
          confirming?.productCount
            ? `“${confirming.name}” will be removed. Its ${confirming.productCount} product(s) stay in ${categoryName} — they just won't sit under a subcategory any more.`
            : `“${confirming?.name}” will be removed. This action cannot be undone.`
        }
        pending={pending}
        onConfirm={remove}
        onCancel={() => !pending && setConfirming(null)}
      />
    </>
  );
}
