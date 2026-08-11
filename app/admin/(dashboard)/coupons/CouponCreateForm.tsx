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
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WOW10"
              required
            />
            <button
              type="button"
              onClick={() => {
                // Unambiguous alphabet — no O/0 or I/1 lookalikes to mistype.
                const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
                let random = "";
                for (let i = 0; i < 6; i++) {
                  random += alphabet[Math.floor(Math.random() * alphabet.length)];
                }
                setCode(`WOW-${random}`);
              }}
              className="shrink-0 rounded-lg border border-line px-3 text-nano font-semibold text-gold-700 transition-colors hover:border-gold-400 hover:bg-gold-50"
            >
              Generate
            </button>
          </div>
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
