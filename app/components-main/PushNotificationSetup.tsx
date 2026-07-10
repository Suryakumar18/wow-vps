"use client";

/**
 * PushNotificationSetup
 * Drop this anywhere in the user-facing layout (e.g. inside CartContext/root layout).
 * It silently registers the service worker and subscribes the user to push notifications.
 * No UI is rendered unless permission is needed.
 */

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationSetup() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || vapidKey.startsWith("YOUR_")) return;

    const setup = async () => {
      try {
        // 1. Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // 2. Check permission — don't prompt automatically; only subscribe if already granted
        if (Notification.permission === "denied") return;

        // 3. If not yet granted, ask user
        let permission: NotificationPermission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted") return;

        // 4. Get or create push subscription
        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // 5. Save to backend — attach userId if logged in
        let userId: string | null = null;
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          userId = u?._id || u?.id || null;
        } catch {}

        await fetch("/api/push/subscribe", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            userId,
          }),
        });
      } catch (err) {
        // Silent — push is non-critical
        console.debug("Push setup skipped:", err);
      }
    };

    setup();
  }, []);

  return null; // No visible UI
}
