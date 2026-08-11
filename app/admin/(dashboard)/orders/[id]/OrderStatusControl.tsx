"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../../Toast";
import { ORDER_STATUSES, type AdminOrderStatus } from "../../../orderStatus";
import { Select } from "../../ui";

export default function OrderStatusControl({
  id,
  current,
}: {
  id: string;
  current: AdminOrderStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<AdminOrderStatus>(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (next: AdminOrderStatus) => {
    const previous = status;
    setStatus(next);
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setStatus(previous);
        setError(body?.error ?? "Couldn't update the status.");
        return;
      }
      toast.success(`Order marked ${next.toLowerCase()}.`);
      router.refresh();
    } catch {
      setStatus(previous);
      setError("Couldn't reach the server.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full sm:w-56">
      <label className="flex flex-col gap-1.5">
        <span className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">Status</span>
        <Select
          value={status}
          disabled={pending}
          onChange={(e) => onChange(e.target.value as AdminOrderStatus)}
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </label>
      {error && <p className="mt-1 text-nano text-[#B91C1C]">{error}</p>}
    </div>
  );
}
