"use client";

import { useState } from "react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, FormError } from "../ui";
import { useToast } from "../Toast";

export default function PasswordForm() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (next.length < 8) return setError("Use at least 8 characters.");
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next === current) return setError("The new password is the same as the current one.");

    setPending(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Couldn't change your password.");
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Your password has been changed.");
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-[30rem] rounded-xl border border-line bg-white p-5">
      <h2 className="text-ui font-bold text-ink">Change password</h2>
      <p className="mt-0.5 text-nano text-slate-500">
        You'll stay signed in on this device after changing it.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <Field label="Current password">
          <Input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </Field>
        <Field label="New password">
          <Input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>

        <FormError>{error}</FormError>

        <div>
          <Button type="submit" size="md" disabled={pending}>
            {pending ? "Changing…" : "Change password"}
          </Button>
        </div>
      </div>
    </form>
  );
}
