import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Meta WhatsApp webhook.
 *
 * In the app dashboard (WhatsApp → Configuration → Webhooks):
 *   Callback URL:  https://<your-domain>/api/whatsapp/webhook
 *   Verify token:  the value of WHATSAPP_VERIFY_TOKEN
 * then subscribe to the "messages" field.
 *
 * GET is Meta's one-time verification handshake. POST receives message and
 * status events; replies from customers here are what open the 24-hour
 * window that lets free-form (non-template) messages through.
 */

/** Meta's verification handshake: echo hub.challenge back as plain text. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * Checks X-Hub-Signature-256 when WHATSAPP_APP_SECRET is set (App settings →
 * Basic → App secret). Without it, events are accepted unauthenticated —
 * fine while testing, set the secret for production.
 */
function signatureValid(raw: string, header: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true;
  if (!header) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(raw).digest("hex")}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!signatureValid(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Always ack fast with 200 — Meta retries with escalating backoff and can
  // eventually disable the subscription if the endpoint keeps failing.
  try {
    const payload = JSON.parse(raw);
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value;
        for (const message of value?.messages ?? []) {
          // A customer wrote to the business — log it so replies are visible
          // in server logs until an inbox UI exists. This also marks an open
          // 24-hour service window for that number.
          console.log(
            `WhatsApp message from ${message.from} (${message.type}):`,
            message.text?.body ?? "",
          );
        }
        for (const status of value?.statuses ?? []) {
          // Delivery lifecycle of messages we sent: sent → delivered → read,
          // or failed (with the reason Meta gives, e.g. outside 24h window).
          if (status.status === "failed") {
            console.error(
              `WhatsApp message ${status.id} to ${status.recipient_id} failed:`,
              JSON.stringify(status.errors ?? []),
            );
          }
        }
      }
    }
  } catch {
    // Unparseable body — ack anyway; there's nothing to retry into success.
  }

  return NextResponse.json({ ok: true });
}
