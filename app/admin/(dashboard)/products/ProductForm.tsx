"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, FileText, ImageIcon, IndianRupee, Palette, Plus, Trash2, Truck } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";
import { Field, Input, Select, Textarea, FormError } from "../ui";
import MediaUploader from "../MediaUploader";
import { useToast } from "../Toast";

export interface ProductFormValues {
  id?: string;
  slug: string;
  title: string;
  price: string;
  originalPrice: string;
  totalStock: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  brandId: string;
  isPublished: boolean;
  /** Per-product shipping fee (₹), stored as a string for the input. */
  shippingFee: string;
  /** True when the admin ticked "charge GST"; the percent input reads it as
   *  the enable/disable toggle so a numeric 0 doesn't mean two things. */
  gstEnabled: boolean;
  /** GST rate as a string percent — only sent when gstEnabled is true. */
  gstPercent: string;
  /** One entry per line in the textarea. */
  aboutFeatures: string;
  idealFor: string;
  /** Each colour carries a swatch hex + its own gallery. Empty images = no
   *  gallery swap when the shopper picks that colour. */
  colors: { name: string; hex: string; images: string[] }[];
  /** Public URLs on the VPS, in gallery order. */
  images: string[];
  videos: string[];
  /** One "Label: value" pair per line. */
  specifications: string;
}

const linesOf = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const parseSpecs = (value: string) =>
  linesOf(value).map((line) => {
    const [label, ...rest] = line.split(":");
    return { label: label.trim(), value: rest.join(":").trim() };
  });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Native <input type="color"> always emits `#rrggbb`, but a shape safety net
 *  keeps garbage out of the DB if someone edits values by hand. */
const normaliseHex = (value: string): string => {
  const v = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : "#000000";
};

/** The tab identities. Order here drives the tab bar order. */
type TabKey = "general" | "pricing" | "shipping" | "media" | "colours" | "details";

const TABS: { key: TabKey; label: string; icon: typeof Boxes }[] = [
  { key: "general", label: "General", icon: FileText },
  { key: "pricing", label: "Pricing & inventory", icon: IndianRupee },
  { key: "shipping", label: "Shipping & tax", icon: Truck },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "colours", label: "Colours", icon: Palette },
  { key: "details", label: "Details", icon: Boxes },
];

/** A titled card — the panel body for the currently active tab. */
function Section({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: typeof Boxes;
  title: string;
  description: string;
  children: React.ReactNode;
  /** Entrance stagger, seconds — later cards on a tab slide in slightly after. */
  delay?: number;
}) {
  return (
    <motion.section
      key={title}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
      className="rounded-xl border border-line bg-white"
    >
      <header className="flex items-start gap-3 border-b border-line p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-600">
          <Icon size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-ui font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-nano text-slate-500">{description}</p>
        </div>
      </header>
      <div className="grid gap-4 p-5 md:grid-cols-2">{children}</div>
    </motion.section>
  );
}

/** Which tab holds each validated field — lets a submission from any tab
 *  land the shopper on the tab that actually has the offending input. */
type FieldName =
  | "title"
  | "slug"
  | "categoryId"
  | "brandId"
  | "price"
  | "originalPrice"
  | "gstPercent";
const FIELD_TAB: Record<FieldName, TabKey> = {
  title: "general",
  slug: "general",
  categoryId: "general",
  brandId: "general",
  price: "pricing",
  originalPrice: "pricing",
  gstPercent: "shipping",
};

export default function ProductForm({
  initial,
  categories,
  brands,
  subcategories,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  subcategories: { id: string; name: string; categoryId: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Once the slug is edited by hand, stop deriving it from the title.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  /** Setting a validation error and jumping to the tab that holds the field
   *  are always paired — otherwise a shopper submitting from the "Colours"
   *  tab sees a "Set a price above zero" toast with no visible price input. */
  const failValidation = (field: FieldName, message: string) => {
    setError(message);
    setActiveTab(FIELD_TAB[field]);
  };

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onTitleChange = (title: string) =>
    setValues((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));

  const available = useMemo(
    () => subcategories.filter((s) => s.categoryId === values.categoryId),
    [subcategories, values.categoryId],
  );

  const price = Number(values.price) || 0;
  const mrp = Number(values.originalPrice) || 0;
  const discount = useMemo(
    () => (mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0),
    [mrp, price],
  );

  const stock = Number(values.totalStock) || 0;
  const stockTone =
    stock === 0 ? "text-[#B91C1C]" : stock <= 10 ? "text-gold-700" : "text-[#0F7B3F]";
  const stockLabel = stock === 0 ? "Out of stock" : stock <= 10 ? "Low stock" : "In stock";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!values.title.trim()) return failValidation("title", "Give the product a title.");
    if (!values.slug.trim())
      return failValidation("slug", "The product needs a slug for its URL.");
    if (!values.categoryId) return failValidation("categoryId", "Choose a category.");
    if (!values.brandId) return failValidation("brandId", "Choose a brand.");
    if (price <= 0) return failValidation("price", "Set a price above zero.");
    if (mrp > 0 && mrp < price) {
      return failValidation("originalPrice", "The MRP can't be lower than the selling price.");
    }
    const shippingFee = Math.max(0, Math.round(Number(values.shippingFee) || 0));
    const gstPercentNum = Math.round(Number(values.gstPercent) || 0);
    if (values.gstEnabled && (gstPercentNum <= 0 || gstPercentNum > 100)) {
      return failValidation(
        "gstPercent",
        "Enter a GST rate between 1 and 100 — or turn GST off.",
      );
    }

    setPending(true);
    const payload = {
      slug: values.slug.trim(),
      title: values.title.trim(),
      price,
      originalPrice: mrp || price,
      totalStock: stock,
      shippingFee,
      // Storing 0 disables GST server-side, so an off-toggle is a plain 0.
      gstPercent: values.gstEnabled ? gstPercentNum : 0,
      description: values.description.trim(),
      categoryId: values.categoryId,
      subcategoryId: values.subcategoryId || null,
      brandId: values.brandId,
      isPublished: values.isPublished,
      aboutFeatures: linesOf(values.aboutFeatures),
      idealFor: linesOf(values.idealFor),
      // Drop half-filled colour rows so an admin who added an empty row and
      // forgot doesn't create a nameless colour with no photos.
      colors: values.colors
        .map((c) => ({
          name: c.name.trim(),
          hex: normaliseHex(c.hex),
          images: c.images,
        }))
        .filter((c) => c.name.length > 0),
      images: values.images,
      videos: values.videos,
      specifications: parseSpecs(values.specifications),
    };

    try {
      const res = await fetch(
        values.id ? `/api/admin/products/${values.id}` : "/api/admin/products",
        {
          method: values.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't save this product.");
        return;
      }
      toast.success(values.id ? `“${payload.title}” was saved.` : `“${payload.title}” was created.`);
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="pb-24">
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <Section
          icon={FileText}
          title="General"
          description="What the product is called and where it sits in the catalogue."
          delay={0}
        >
          <Field label="Title">
            <Input
              value={values.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Raptor X4WD"
              required
            />
          </Field>
          <Field label="Slug (URL)">
            <Input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              disabled={Boolean(values.id)}
              placeholder="raptor-x4wd"
              required
            />
          </Field>

          <Field label="Category">
            <Select
              value={values.categoryId}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: "" }))
              }
              required
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Brand">
            <Select value={values.brandId} onChange={(e) => set("brandId", e.target.value)} required>
              <option value="">Select a brand…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Subcategory">
            <Select
              value={values.subcategoryId}
              onChange={(e) => set("subcategoryId", e.target.value)}
              disabled={!values.categoryId || available.length === 0}
            >
              <option value="">
                {!values.categoryId
                  ? "Choose a category first"
                  : available.length === 0
                    ? "This category has no subcategories"
                    : "None — sits directly under the category"}
              </option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Visibility">
            <Select
              value={values.isPublished ? "published" : "hidden"}
              onChange={(e) => set("isPublished", e.target.value === "published")}
            >
              <option value="published">Published — visible in the store</option>
              <option value="hidden">Hidden — not shown to shoppers</option>
            </Select>
          </Field>
        </Section>

        <Section
          icon={IndianRupee}
          title="Pricing & inventory"
          description="What it sells for and how many you have."
          delay={0.05}
        >
          <Field label="Price (₹)">
            <Input
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </Field>
          <Field label="Original price / MRP (₹)">
            <Input
              type="number"
              min={0}
              value={values.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
            />
          </Field>

          <Field label="Stock">
            <Input
              type="number"
              min={0}
              value={values.totalStock}
              onChange={(e) => set("totalStock", e.target.value)}
            />
          </Field>

          {/* Live read-out so the discount shoppers will see is visible while typing. */}
          <div className="flex items-end">
            <dl className="flex w-full flex-wrap items-baseline gap-x-5 gap-y-2 rounded-lg bg-mist px-4 py-3">
              <div>
                <dt className="text-nano text-slate-500">Shoppers pay</dt>
                <dd className="text-ui font-bold tabular-nums text-ink">{formatPrice(price)}</dd>
              </div>
              <div>
                <dt className="text-nano text-slate-500">Discount</dt>
                <dd
                  className={cn(
                    "text-ui font-bold tabular-nums",
                    discount > 0 ? "text-[#0F7B3F]" : "text-slate-400",
                  )}
                >
                  {discount > 0 ? `${discount}%` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-nano text-slate-500">Availability</dt>
                <dd className={cn("text-ui font-bold tabular-nums", stockTone)}>{stockLabel}</dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section
          icon={Truck}
          title="Shipping & tax"
          description="Applied to this product at checkout. Shipping is charged once per line — buying two of the same product ships once."
          delay={0.075}
        >
          <Field label="Shipping fee (₹)">
            <Input
              type="number"
              min={0}
              value={values.shippingFee}
              onChange={(e) => set("shippingFee", e.target.value)}
              placeholder="0 = free shipping"
            />
          </Field>

          <Field label="GST">
            <Select
              value={values.gstEnabled ? "on" : "off"}
              onChange={(e) => set("gstEnabled", e.target.value === "on")}
            >
              <option value="off">Not applicable</option>
              <option value="on">Charge GST</option>
            </Select>
          </Field>

          {values.gstEnabled && (
            <Field label="GST rate (%)">
              <Input
                type="number"
                min={1}
                max={100}
                value={values.gstPercent}
                onChange={(e) => set("gstPercent", e.target.value)}
                placeholder="e.g. 18"
              />
            </Field>
          )}
        </Section>

        <Section
          icon={ImageIcon}
          title="Media"
          description="Gallery images and video. Files upload straight to the media server."
          delay={0.1}
        >
          <div className="md:col-span-2">
            <p className="mb-1.5 text-micro font-medium text-ink">Gallery images</p>
            <MediaUploader
              values={values.images}
              onChange={(next) => set("images", next)}
              accept="image"
              folder="products"
            />
          </div>

          <div className="md:col-span-2">
            <p className="mb-1.5 text-micro font-medium text-ink">Product videos</p>
            <MediaUploader
              values={values.videos}
              onChange={(next) => set("videos", next)}
              accept="video"
            />
          </div>
        </Section>

        <Section
          icon={Palette}
          title="Available colours"
          description="Add each colour the product ships in, along with the photos to show when a shopper picks that colour."
          delay={0.125}
        >
          <div className="md:col-span-2 flex flex-col gap-4">
            {values.colors.length === 0 && (
              <p className="rounded-lg border border-dashed border-line bg-mist px-4 py-6 text-center text-nano text-slate-500">
                No colours added yet. This product will show a single default gallery.
              </p>
            )}

            {values.colors.map((color, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-line bg-mist/40 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* The swatch IS the color picker — clicking the tile opens
                      the OS colour dialog. Wrapping the input in the label
                      keeps native semantics without an extra "Pick colour"
                      button that only exists to launch the dialog. */}
                  <Field label="Swatch" className="shrink-0">
                    <label
                      className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-line bg-white shadow-card transition-colors hover:border-gold-400"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    >
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) => {
                          const next = [...values.colors];
                          next[index] = { ...next[index], hex: e.target.value };
                          set("colors", next);
                        }}
                        aria-label={`Pick a swatch colour for colour ${index + 1}`}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                      <Palette
                        size={13}
                        aria-hidden="true"
                        className="mix-blend-difference text-white opacity-70"
                      />
                    </label>
                  </Field>

                  <Field label={`Colour ${index + 1}`} className="min-w-0 flex-1">
                    <Input
                      value={color.name}
                      onChange={(e) => {
                        const next = [...values.colors];
                        next[index] = { ...next[index], name: e.target.value };
                        set("colors", next);
                      }}
                      placeholder="e.g. Red, Navy, Rose Gold"
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={() => {
                      const next = values.colors.filter((_, i) => i !== index);
                      set("colors", next);
                    }}
                    aria-label={`Remove colour ${color.name || index + 1}`}
                    className="mt-6 grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-[#B91C1C]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-nano text-slate-500">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-full border border-line"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-mono">{color.hex}</span>
                </div>
                <div>
                  <p className="mb-1.5 text-micro font-medium text-ink">
                    Photos for this colour
                  </p>
                  <MediaUploader
                    values={color.images}
                    onChange={(nextImages) => {
                      const next = [...values.colors];
                      next[index] = { ...next[index], images: nextImages };
                      set("colors", next);
                    }}
                    accept="image"
                    folder="products"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                set("colors", [
                  ...values.colors,
                  { name: "", hex: "#c9a55a", images: [] },
                ])
              }
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-micro font-semibold text-gold-600 transition-colors hover:border-gold-400 hover:bg-gold-50"
            >
              <Plus size={14} aria-hidden="true" />
              Add colour
            </button>
          </div>
        </Section>

        <Section
          icon={Boxes}
          title="Details"
          description="The copy that fills out the product page."
          delay={0.15}
        >
          <Field label="Description" className="md:col-span-2">
            <Textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A 1:10 scale four-wheel-drive monster truck built for rough ground…"
            />
          </Field>

          <Field label="Highlights — one per line" className="md:col-span-2">
            <Textarea
              value={values.aboutFeatures}
              onChange={(e) => set("aboutFeatures", e.target.value)}
              placeholder={"1:10 Scale 4WD\n2.4GHz Remote Control"}
            />
          </Field>

          <Field label="Ideal for — one per line">
            <Textarea
              value={values.idealFor}
              onChange={(e) => set("idealFor", e.target.value)}
              placeholder={"Ages 8+\nOutdoor"}
            />
          </Field>
          <Field label="Specifications — one “Label: value” per line" className="md:col-span-2">
            <Textarea
              value={values.specifications}
              onChange={(e) => set("specifications", e.target.value)}
              placeholder={"Remote: 2.4GHz\nTop Speed: 60 km/h"}
            />
          </Field>
        </Section>
      </div>

      {/* Sticky action bar — a long form shouldn't need scrolling back to save. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-gutter py-3 backdrop-blur-sm lg:left-[16rem]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <FormError>{error}</FormError>
          </div>
          <Button href="/admin/products" variant="outline" size="md" className="shrink-0">
            Cancel
          </Button>
          <Button type="submit" size="md" disabled={pending} className="shrink-0">
            {pending ? "Saving…" : values.id ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
