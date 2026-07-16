"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Package } from "lucide-react";

interface Notif {
  _id: string;
  title: string;
  message: string;
  orderId?: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

const POLL_MS = 30_000;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const authHeaders = (): Record<string, string> => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token")?.replace(/['"]+/g, "") : "";
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { headers: { ...authHeaders() } });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setUnread(json.unreadCount || 0);
      }
    } catch {
      /* non-critical */
    }
  }, []);

  // Initial load + polling.
  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      /* non-critical */
    }
  }, []);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next && unread > 0) markAllRead();
      return next;
    });
  };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button className="topbar-icon-btn" aria-label="Notifications" onClick={toggle}>
        <Bell size={16} />
        {unread > 0 && <span className="topbar-notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <span className="notif-head-title">Notifications</span>
            {items.length > 0 && (
              <button className="notif-head-clear" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {items.length === 0 ? (
              <div className="notif-empty">You&apos;re all caught up 🎉</div>
            ) : (
              items.map((n) => (
                <Link
                  key={n._id}
                  href={n.url || "/admin/order-history"}
                  className={`notif-item ${n.read ? "" : "unread"}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="notif-item-icon">
                    <Package size={15} />
                  </span>
                  <span className="notif-item-body">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-msg">{n.message}</span>
                    <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
