/* ────────────────────────────────────────────────────────────────────────────
   WOW Lifestyle – Service Worker
   Handles background push notifications for order status updates
   ──────────────────────────────────────────────────────────────────────────── */

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

/* ── Push event ─────────────────────────────────────────────────────────────── */
self.addEventListener("push", (e) => {
  if (!e.data) return;

  let data = {};
  try { data = e.data.json(); } catch { data = { title: "WOW Lifestyle", body: e.data.text() }; }

  const title   = data.title   || "WOW Lifestyle";
  const body    = data.body    || "Your order has been updated.";
  const icon    = data.icon    || "/wow-logo.png";
  const badge   = data.badge   || "/wow-logo.png";
  const tag     = data.tag     || "order-update";
  const url     = data.url     || "/orders";

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data:    { url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

/* ── Notification click ─────────────────────────────────────────────────────── */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/orders";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
