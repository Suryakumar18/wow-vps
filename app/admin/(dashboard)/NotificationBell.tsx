"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, PackageSearch } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
}

const POLL_MS = 30_000;

/** "3m ago", "2h ago", "5 Aug" — precise enough without a date library. */
function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(then);
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok || !mounted.current) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* a failed poll just leaves the last known state */
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    // Polling rather than websockets: one small query every 30s is far less
    // machinery than a socket for a back office this size.
    const id = setInterval(load, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const markAllRead = async () => {
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    await fetch("/api/admin/notifications", { method: "PATCH" }).catch(() => {});
    router.refresh();
  };

  const openItem = async (item: NotificationRow) => {
    setOpen(false);
    if (!item.isRead) {
      setUnread((n) => Math.max(0, n - 1));
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)));
      await fetch(`/api/admin/notifications/${item.id}`, { method: "PATCH" }).catch(() => {});
    }
    if (item.href) router.push(item.href);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold-300 hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
      >
        <Bell size={17} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-[#B91C1C] px-1 text-[0.625rem] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-line bg-white shadow-card-hover"
            >
              <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <h2 className="text-micro font-bold text-ink">Notifications</h2>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-nano font-semibold text-gold-700 transition-colors hover:text-gold-600"
                  >
                    <CheckCheck size={13} aria-hidden="true" />
                    Mark all read
                  </button>
                )}
              </header>

              <div className="max-h-[22rem] overflow-y-auto">
                {loading ? (
                  <ul className="p-2">
                    {Array.from({ length: 3 }, (_, i) => (
                      <li key={i} className="px-2 py-3">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-mist" />
                        <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-mist" />
                      </li>
                    ))}
                  </ul>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-10 text-center">
                    <PackageSearch size={22} aria-hidden="true" className="text-slate-300" />
                    <p className="mt-2 text-micro font-semibold text-ink">Nothing yet</p>
                    <p className="mt-0.5 text-nano text-slate-500">
                      New orders will show up here as they come in.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openItem(item)}
                          className={cn(
                            "flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-mist",
                            !item.isRead && "bg-gold-50/60",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                              item.isRead ? "bg-transparent" : "bg-gold-500",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-micro font-semibold text-ink">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block truncate text-nano text-slate-500">
                              {item.body}
                            </span>
                            <span className="mt-1 block text-nano text-slate-400">
                              {relativeTime(item.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href="/admin/orders"
                onClick={() => setOpen(false)}
                className="block border-t border-line px-4 py-2.5 text-center text-nano font-semibold text-gold-700 transition-colors hover:bg-mist"
              >
                View all orders
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
