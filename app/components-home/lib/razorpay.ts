"use client";

import type { CartItem } from "./CartContext";
import type { Address } from "./addresses";
import type { DeliveryMethodId, OrderTotals } from "./pricing";
import type { Order } from "./orders";

/**
 * Razorpay checkout helper — talks to two of our own routes and the hosted
 * Razorpay modal.
 *
 * Flow: create Razorpay order server-side → load Razorpay checkout.js →
 * open modal → on success POST to /api/razorpay/verify which HMAC-verifies
 * the signature and writes the DB order. Signature verification is what
 * keeps a hostile client from forging a "paid" response and getting a real
 * order row for free.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; contact?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (err: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay must run in the browser."));
  if (window.Razorpay) return Promise.resolve();
  // Cached so a shopper who opens the modal, dismisses, and re-opens doesn't
  // re-download the SDK — and so two simultaneous callers share one load.
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay. Check your internet connection."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface PayWithRazorpayInput {
  amount: number;
  customer: { name: string; contact: string; email?: string };
  order: {
    items: CartItem[];
    address: Address;
    deliveryMethod: DeliveryMethodId;
    paymentMethodLabel: string;
    totals: OrderTotals;
  };
  onDismiss?: () => void;
}

export async function payWithRazorpay(input: PayWithRazorpayInput): Promise<Order> {
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!publicKey) {
    throw new Error("Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.");
  }

  const orderRes = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amount }),
  });
  if (!orderRes.ok) {
    const { error } = await orderRes.json().catch(() => ({ error: "Failed to create payment order." }));
    throw new Error(error ?? "Failed to create payment order.");
  }
  const rzOrder = (await orderRes.json()) as { id: string; amount: number; currency: string };

  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay SDK unavailable.");

  return new Promise<Order>((resolve, reject) => {
    // Razorpay auto-closes its modal after a successful `handler`, which then
    // fires `ondismiss` — without this flag, ondismiss would call
    // `onDismiss()` (flipping the checkout button back to "Pay Now") between
    // the payment succeeding and our router.push landing. Set the flag inside
    // handler before doing anything async so the two events never race.
    let settled = false;

    const rz = new window.Razorpay!({
      key: publicKey,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      order_id: rzOrder.id,
      name: "WOW Lifestyle",
      description: `Order (${input.order.items.length} item${input.order.items.length === 1 ? "" : "s"})`,
      prefill: input.customer,
      theme: { color: "#C9A55A" },
      handler: async (response) => {
        settled = true;
        try {
          // From here the customer HAS been charged — verification turns that
          // charge into an order row. A transient network drop must not
          // strand a paid customer, so one retry; /api/razorpay/verify is
          // idempotent (keyed on payment id), so a retry after a lost
          // response returns the already-created order, never a duplicate.
          let verifyRes: Response | null = null;
          for (let attempt = 0; attempt < 2 && !verifyRes?.ok; attempt++) {
            verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, order: input.order }),
            }).catch(() => null);
          }
          if (!verifyRes) {
            throw new Error(
              "Your payment went through, but we couldn't confirm the order — " +
                "do NOT pay again. Check My Orders in a minute, or contact us " +
                `with payment id ${response.razorpay_payment_id}.`,
            );
          }
          if (!verifyRes.ok) {
            const { error } = await verifyRes
              .json()
              .catch(() => ({ error: "Payment verification failed." }));
            throw new Error(error ?? "Payment verification failed.");
          }
          resolve((await verifyRes.json()) as Order);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      },
      modal: {
        ondismiss: () => {
          if (settled) return;
          input.onDismiss?.();
          reject(new Error("Payment cancelled."));
        },
      },
    });

    rz.on("payment.failed", (err) => {
      settled = true;
      reject(new Error(err?.error?.description ?? "Payment failed. Please try again."));
    });

    rz.open();
  });
}
