"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, FormError } from "../ui";

export default function CouponCreateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, percentOff: Number(percentOff), minOrder: Number(minOrder) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't create this coupon.");
        return;
      }
      setCode("");
      setPercentOff("");
      setMinOrder("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mb-5 rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Code" className="min-w-[9rem] flex-1">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WOW10" required />
        </Field>
        <Field label="Discount %" className="min-w-[7rem]">
          <Input
            type="number"
            min={1}
            max={100}
            value={percentOff}
            onChange={(e) => setPercentOff(e.target.value)}
            placeholder="10"
            required
          />
        </Field>
        <Field label="Min. order (₹)" className="min-w-[8rem]">
          <Input
            type="number"
            min={0}
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="1499"
            required
          />
        </Field>
        <Button type="submit" size="md" disabled={pending} className="shrink-0">
          {pending ? "Adding…" : "Add Coupon"}
        </Button>
      </div>
      <FormError>{error}</FormError>
    </form>
  );
}
