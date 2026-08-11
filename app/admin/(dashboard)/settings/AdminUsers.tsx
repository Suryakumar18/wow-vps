"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, ShieldOff, UserCircle } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, FormError, TableCard, Th, Td, Tr } from "../ui";
import StatusBadge from "../StatusBadge";
import ConfirmDialog from "../ConfirmDialog";
import { useToast } from "../Toast";

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function AdminUsers({
  initial,
  currentId,
}: {
  initial: AdminRow[];
  currentId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState<AdminRow | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Couldn't add that admin.");
        return;
      }
      setRows((prev) => [
        ...prev,
        { id: body.id, name: body.name, email: body.email, createdAt: body.createdAt },
      ]);
      toast.success(
        body.promoted
          ? `${body.name} was an existing customer — now promoted to admin.`
          : `${body.name} can now sign in to the admin panel.`,
      );
      setForm({ name: "", email: "", password: "" });
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  const revoke = async () => {
    if (!confirming) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${confirming.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't remove that admin.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== confirming.id));
      toast.success(`${confirming.name} no longer has admin access.`);
      setConfirming(null);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={add} className="max-w-[42rem] rounded-xl border border-line bg-white p-5">
        <h2 className="text-ui font-bold text-ink">Add an admin</h2>
        <p className="mt-0.5 text-nano text-slate-500">
          They sign in through the same login page — an admin account is simply routed to the panel.
          If the email already belongs to a customer, that account is promoted rather than duplicated.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Priya"
              required
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="priya@wowlifestyle.com"
              required
            />
          </Field>
          <Field label="Temporary password">
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="At least 8 characters"
              required
            />
          </Field>
        </div>

        <FormError>{error}</FormError>

        <div className="mt-2">
          <Button type="submit" size="sm" disabled={pending}>
            <Plus size={14} aria-hidden="true" />
            {pending ? "Adding…" : "Add admin"}
          </Button>
        </div>
      </form>

      <TableCard>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Added</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row.id}>
              <Td>
                <span className="flex items-center gap-2">
                  <UserCircle size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
                  <span className="font-semibold">{row.name}</span>
                  {row.id === currentId && <StatusBadge status="You" tone="info" />}
                </span>
              </Td>
              <Td className="text-slate-500">{row.email}</Td>
              <Td className="whitespace-nowrap text-slate-500">
                {dateFormatter.format(new Date(row.createdAt))}
              </Td>
              <Td className="text-right">
                {row.id === currentId ? (
                  <span className="text-nano text-slate-400">—</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(row)}
                    aria-label={`Remove admin access for ${row.name}`}
                    title="Remove admin access"
                    className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-[#B91C1C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
                  >
                    <ShieldOff size={14} aria-hidden="true" />
                  </button>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableCard>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Remove admin access"
        description={`${confirming?.name} will lose access to the admin panel. Their account and order history are kept — they simply become a normal customer.`}
        confirmLabel="Remove access"
        pending={pending}
        onConfirm={revoke}
        onCancel={() => !pending && setConfirming(null)}
      />
    </div>
  );
}
