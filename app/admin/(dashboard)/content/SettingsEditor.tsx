"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Button from "@/app/components-home/ui/Button";
import { Field, Input, Textarea, FormError } from "../ui";

export interface SettingRow {
  key: string;
  value: string;
  group: string;
  multiline: boolean;
}

/** Turns `brand.searchPlaceholder` into "Search placeholder". */
function humanise(key: string) {
  const last = key.split(".").slice(1).join(" ") || key;
  const spaced = last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function SettingsEditor({ initial }: { initial: SettingRow[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(initial.map((s) => [s.key, s.value])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, SettingRow[]>();
    for (const row of initial) {
      map.set(row.group, [...(map.get(row.group) ?? []), row]);
    }
    return [...map.entries()];
  }, [initial]);

  const dirty = initial.some((s) => values[s.key] !== s.value);

  const save = async () => {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Couldn't save these settings.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setPending(false);
    }
  };

  if (initial.length === 0) {
    return (
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="text-ui font-bold text-ink">Text &amp; labels</h2>
        <p className="mt-1 text-micro text-slate-500">
          Nothing seeded yet — run{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-nano">
            npx tsx prisma/seed-content.ts
          </code>{" "}
          to import the current site copy.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h2 className="text-ui font-bold text-ink">Text &amp; labels</h2>
          <p className="mt-0.5 text-nano text-slate-500">
            {initial.length} editable strings across the storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && !dirty && (
            <span className="flex items-center gap-1.5 text-nano font-semibold text-[#0F7B3F]">
              <Check size={13} aria-hidden="true" />
              Saved
            </span>
          )}
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 p-5">
        {groups.map(([group, rows]) => (
          <div key={group}>
            <h3 className="mb-3 text-nano font-bold uppercase tracking-[0.14em] text-gold-600">
              {group}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {rows.map((row) => (
                <Field
                  key={row.key}
                  label={humanise(row.key)}
                  className={row.multiline ? "md:col-span-2" : undefined}
                >
                  {row.multiline ? (
                    <Textarea
                      value={values[row.key] ?? ""}
                      onChange={(e) => {
                        setSaved(false);
                        setValues((v) => ({ ...v, [row.key]: e.target.value }));
                      }}
                    />
                  ) : (
                    <Input
                      value={values[row.key] ?? ""}
                      onChange={(e) => {
                        setSaved(false);
                        setValues((v) => ({ ...v, [row.key]: e.target.value }));
                      }}
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}

        <FormError>{error}</FormError>
      </div>
    </section>
  );
}
