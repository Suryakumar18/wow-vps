"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ImageOff, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";
import { Th, Td, Tr } from "../ui";
import SortableTh from "../SortableTh";
import StatusBadge from "../StatusBadge";
import ConfirmDialog from "../ConfirmDialog";
import BulkBar from "../BulkBar";
import EmptyState from "../EmptyState";
import Pagination from "../Pagination";
import { useToast } from "../Toast";

export interface ProductRow {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  categoryName: string;
  brandName: string;
  price: number;
  totalStock: number;
  isPublished: boolean;
  isFeatured: boolean;
  isDeal: boolean;
}

const BASE = "/admin/products";
const LOW_STOCK = 10;

/** Stock reads as a status, not just a number. */
function stockStatus(stock: number) {
  if (stock <= 0) return { label: "Out of stock", tone: "danger" as const };
  if (stock <= LOW_STOCK) return { label: "Low stock", tone: "warning" as const };
  return { label: "In stock", tone: "success" as const };
}

export default function ProductsTable({
  rows,
  page,
  pageSize,
  total,
  hasFilters,
}: {
  rows: ProductRow[];
  page: number;
  pageSize: number;
  total: number;
  hasFilters: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; label: string } | null>(null);
  const [pending, setPending] = useState(false);

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runDelete = async () => {
    if (!confirm) return;
    setPending(true);

    const results = await Promise.all(
      confirm.ids.map((id) =>
        fetch(`/api/admin/products/${id}`, { method: "DELETE" })
          .then((res) => res.ok)
          .catch(() => false),
      ),
    );
    const failed = results.filter((ok) => !ok).length;

    setPending(false);
    setConfirm(null);
    setSelected(new Set());

    if (failed === 0) {
      toast.success(
        confirm.ids.length === 1
          ? `“${confirm.label}” was deleted.`
          : `${confirm.ids.length} products were deleted.`,
      );
    } else {
      toast.error(`${failed} of ${confirm.ids.length} could not be deleted.`);
    }
    router.refresh();
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-white">
        {hasFilters ? (
          <EmptyState
            variant="no-results"
            title="No products match those filters"
            description="Try a different search term, or clear the filters to see everything."
          />
        ) : (
          <EmptyState
            title="No products yet"
            description="Add your first product and it'll appear in the storefront catalogue."
            action={{ label: "Add Product", href: "/admin/products/new" }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
        <div className="min-w-0 max-h-[75vh] overflow-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    // `indeterminate` is a DOM property with no HTML attribute,
                    // so it has to be set on the node itself.
                    ref={(node) => {
                      if (node) node.indeterminate = someSelected;
                    }}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
                    }
                    aria-label={allSelected ? "Deselect all rows" : "Select all rows"}
                    className="h-4 w-4 accent-[#C6A15B]"
                  />
                </Th>
                <Th className="w-16">Image</Th>
                <SortableTh column="title" label="Product" basePath={BASE} />
                <SortableTh column="category" label="Category" basePath={BASE} />
                <SortableTh column="brand" label="Brand" basePath={BASE} />
                <SortableTh column="price" label="Price" basePath={BASE} className="text-right" />
                <SortableTh column="stock" label="Stock" basePath={BASE} className="text-right" />
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const stock = stockStatus(row.totalStock);
                const isSelected = selected.has(row.id);

                return (
                  <Tr key={row.id} className={cn(isSelected && "bg-gold-50 even:bg-gold-50")}>
                    <Td className="w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(row.id)}
                        aria-label={`Select ${row.title}`}
                        className="h-4 w-4 accent-[#C6A15B]"
                      />
                    </Td>
                    <Td className="w-16">
                      <div className="relative h-11 w-11 overflow-hidden rounded-md border border-line bg-mist">
                        {row.image ? (
                          <Image
                            src={row.image}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-slate-300">
                            <ImageOff size={16} aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/products/${row.id}`}
                        className="font-semibold text-ink transition-colors hover:text-gold-700"
                      >
                        {row.title}
                      </Link>
                      <span className="mt-0.5 block text-nano text-slate-500">{row.slug}</span>
                    </Td>
                    <Td>{row.categoryName}</Td>
                    <Td>{row.brandName}</Td>
                    <Td className="text-right tabular-nums">{formatPrice(row.price)}</Td>
                    <Td className="text-right tabular-nums">{row.totalStock}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={row.isPublished ? "Published" : "Hidden"} />
                        <StatusBadge status={stock.label} tone={stock.tone} />
                        {row.isFeatured && <StatusBadge status="Featured" />}
                        {row.isDeal && <StatusBadge status="Deal" tone="info" />}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/products/${row.id}`}
                          aria-label={`Edit ${row.title}`}
                          title="Edit"
                          className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirm({ ids: [row.id], label: row.title })}
                          aria-label={`Delete ${row.title}`}
                          title="Delete"
                          className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-[#B91C1C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageSize={pageSize} total={total} basePath={BASE} />
      </div>

      <BulkBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        pending={pending}
        onDelete={() =>
          setConfirm({ ids: selectedRows.map((r) => r.id), label: `${selectedRows.length} products` })
        }
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.ids.length === 1 ? "Delete product" : "Delete products"}
        description={
          confirm?.ids.length === 1
            ? `“${confirm.label}” will be removed from the catalogue. This action cannot be undone.`
            : `${confirm?.ids.length ?? 0} products will be removed from the catalogue. This action cannot be undone.`
        }
        pending={pending}
        onConfirm={runDelete}
        onCancel={() => !pending && setConfirm(null)}
      />
    </>
  );
}
