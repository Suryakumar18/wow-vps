"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ExternalLink, Info, Pencil } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";
import StatusBadge from "../StatusBadge";
import { useToast } from "../Toast";

export interface NavCategory {
  id: string;
  name: string;
  /** What the storefront header actually prints. Falls back to `name`. */
  menuLabel: string;
  slug: string;
  showInNav: boolean;
  productCount: number;
  subcategories: { name: string; slug: string; productCount: number }[];
}

/**
 * Read-mostly view of the storefront navigation.
 *
 * The nav is generated from the category tree rather than a separate list, so
 * this screen shows what that produces and links to where each part is edited.
 * The only control here is whether a department appears in the nav at all.
 */
export default function NavOverview({ categories }: { categories: NavCategory[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(categories);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const saveLabel = async (row: NavCategory) => {
    const next = draft.trim();
    if (!next || next === row.menuLabel) {
      setEditingId(null);
      return;
    }

    setBusyId(row.id);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, menuLabel: next } : r)));

    try {
      const res = await fetch(`/api/admin/categories/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortTitle: next }),
      });
      if (!res.ok) throw new Error();
      setEditingId(null);
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
      toast.success(`Menu label updated to “${next}”.`);
      router.refresh();
    } catch {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, menuLabel: row.menuLabel } : r)));
      toast.error("Couldn't update the menu label.");
    } finally {
      setBusyId(null);
    }
  };

  const toggle = async (row: NavCategory) => {
    const next = !row.showInNav;
    setBusyId(row.id);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, showInNav: next } : r)));

    try {
      const res = await fetch(`/api/admin/categories/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInNav: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${row.name} ${next ? "added to" : "hidden from"} the navigation.`);
      router.refresh();
    } catch {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, showInNav: !next } : r)));
      toast.error("Couldn't update that category.");
    } finally {
      setBusyId(null);
    }
  };

  const shown = rows.filter((r) => r.showInNav).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2.5 rounded-xl border border-gold-200 bg-gold-50 p-4">
        <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-700" />
        <p className="text-micro text-navy-800">
          The header menu is built from your categories. <strong>Menu label</strong> is exactly what
          shoppers see in the header — it can differ from the full category name, which is used on
          the category page itself. Add or rename departments under{" "}
          <Link href="/admin/categories" className="font-semibold underline underline-offset-2">
            Categories
          </Link>
          ; every link here filters real products.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-white">
        <header className="border-b border-line p-5">
          <h2 className="text-ui font-bold text-ink">Header navigation</h2>
          <p className="mt-0.5 text-nano text-slate-500">
            {shown} of {rows.length} departments shown in the menu.
          </p>
        </header>

        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.id} className={cn("p-4", busyId === row.id && "opacity-60")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {editingId === row.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveLabel(row);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => saveLabel(row)}
                        aria-label={`Menu label for ${row.name}`}
                        className="h-9 min-w-0 flex-1 rounded-md border border-gold-500 bg-white px-2.5 text-micro text-ink outline-none"
                      />
                      <button
                        type="submit"
                        className="text-nano font-semibold text-gold-700 hover:text-gold-600"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="truncate text-micro font-semibold text-ink">
                        {row.menuLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(row.menuLabel);
                          setEditingId(row.id);
                        }}
                        aria-label={`Edit menu label for ${row.name}`}
                        title="Edit menu label"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-gold-700"
                      >
                        <Pencil size={12} aria-hidden="true" />
                      </button>
                      {savedId === row.id && (
                        <Check size={13} aria-hidden="true" className="shrink-0 text-[#0F7B3F]" />
                      )}
                      {row.menuLabel !== row.name && (
                        <span className="hidden truncate text-nano text-slate-400 sm:inline">
                          (category: {row.name})
                        </span>
                      )}
                    </>
                  )}
                  <StatusBadge
                    status={`${row.productCount} product${row.productCount === 1 ? "" : "s"}`}
                    tone={row.productCount > 0 ? "info" : "neutral"}
                  />
                  <Link
                    href={`/category/${row.slug}`}
                    target="_blank"
                    aria-label={`View ${row.name} on the storefront`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-ink"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                  </Link>
                </div>

                <label className="flex shrink-0 items-center gap-2 text-nano text-slate-500">
                  <input
                    type="checkbox"
                    checked={row.showInNav}
                    onChange={() => toggle(row)}
                    disabled={busyId === row.id}
                    className="h-4 w-4 accent-[#C6A15B]"
                  />
                  Show in menu
                </label>
              </div>

              {row.subcategories.length > 0 ? (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {row.subcategories.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={`/category/${row.slug}?sub=${sub.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-nano text-slate-600 transition-colors hover:border-gold-300 hover:text-ink"
                      >
                        {sub.name}
                        <span className="tabular-nums text-slate-400">{sub.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-nano text-slate-400">
                  No subcategories — this department opens straight to its listing.
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
