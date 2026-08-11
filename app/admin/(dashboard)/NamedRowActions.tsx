"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Input } from "./ui";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";

/**
 * Rename and delete for the simple name-only resources (categories, brands).
 *
 * Replaces the `window.prompt` / `window.confirm` pair these used to rely on:
 * native dialogs can't be styled, aren't keyboard-consistent across browsers,
 * and give no room to explain what a delete will do.
 */
export default function NamedRowActions({
  id,
  name,
  resource,
  label,
}: {
  id: string;
  name: string;
  /** API segment — `categories` or `brands`. */
  resource: string;
  /** Singular noun for the copy, e.g. "category". */
  label: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const rename = async () => {
    const next = draft.trim();
    if (!next || next === name) {
      setRenaming(false);
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? `Couldn't rename this ${label}.`);
        return;
      }
      toast.success(`Renamed to “${next}”.`);
      setRenaming(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        // The API refuses to delete anything still in use and explains why.
        toast.error(body?.error ?? `Couldn't delete this ${label}.`);
        return;
      }
      toast.success(`“${name}” was deleted.`);
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={() => {
            setDraft(name);
            setRenaming(true);
          }}
          aria-label={`Rename ${name}`}
          title="Rename"
          className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${name}`}
          title="Delete"
          className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-[#B91C1C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {renaming && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => !pending && setRenaming(false)}
              className="absolute inset-0 bg-navy-950/50"
            />
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-label={`Rename ${label}`}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              onSubmit={(e) => {
                e.preventDefault();
                rename();
              }}
              className="relative w-full max-w-[22rem] rounded-xl border border-line bg-white p-5 shadow-card-hover"
            >
              <h2 className="text-ui font-bold capitalize text-ink">Rename {label}</h2>
              <label className="mt-4 block">
                <span className="text-micro font-medium text-ink">Name</span>
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRenaming(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${label}`}
        description={`“${name}” will be removed. This action cannot be undone.`}
        pending={pending}
        onConfirm={remove}
        onCancel={() => !pending && setConfirming(false)}
      />
    </>
  );
}
