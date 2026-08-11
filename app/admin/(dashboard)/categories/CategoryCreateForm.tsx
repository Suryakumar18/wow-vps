"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, FormError } from "../ui";

export default function CategoryCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't create this category.");
        return;
      }
      setName("");
      setSlug("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mb-5 rounded-xl border border-line bg-white p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Name" className="min-w-[12rem] flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="RC Cars & Vehicles" required />
        </Field>
        <Field label="Slug (URL)" className="min-w-[12rem] flex-1">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="rc-cars" required />
        </Field>
        <Button type="submit" size="md" disabled={pending} className="shrink-0">
          {pending ? "Adding…" : "Add Category"}
        </Button>
      </div>
      <FormError>{error}</FormError>
    </form>
  );
}
