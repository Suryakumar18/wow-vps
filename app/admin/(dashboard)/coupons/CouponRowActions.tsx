"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { useToast } from "../Toast";

export default function CouponRowActions({
  id,
  code,
  active,
}: {
  id: string;
  code: string;
  active: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const toggle = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't update this coupon.");
        return;
      }
      toast.success(`${code} is now ${!active ? "active" : "inactive"}.`);
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
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't delete this coupon.");
        return;
      }
      toast.success(`${code} was deleted.`);
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const iconButton =
    "grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:opacity-50";

  return (
    <>
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={active ? `Deactivate ${code}` : `Activate ${code}`}
          title={active ? "Deactivate" : "Activate"}
          className={`${iconButton} hover:text-gold-700`}
        >
          {active ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          aria-label={`Delete ${code}`}
          title="Delete"
          className={`${iconButton} hover:text-[#B91C1C]`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete coupon"
        description={`“${code}” will stop working immediately for any shopper who tries it. This action cannot be undone.`}
        pending={pending}
        onConfirm={remove}
        onCancel={() => !pending && setConfirming(false)}
      />
    </>
  );
}
