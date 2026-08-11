"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, FormError } from "../ui";

export default function BrandCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't create this brand.");
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mb-5 rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Brand name" className="min-w-[14rem] flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="WOW Racing" required />
        </Field>
        <Button type="submit" size="md" disabled={pending} className="shrink-0">
          {pending ? "Adding…" : "Add Brand"}
        </Button>
      </div>
      <FormError>{error}</FormError>
    </form>
  );
}
