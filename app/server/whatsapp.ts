import "server-only";
import { canonicalPhone } from "./phone";
import { siteUrl } from "./env";

/**
 * Meta WhatsApp Cloud API.
 *
 * Configuration (all optional — see .env.example and WHATSAPP_SETUP.md):
 *
 *   WHATSAPP_ACCESS_TOKEN        Permanent system-user token from the Meta app.
 *   WHATSAPP_PHONE_NUMBER_ID     "Phone number ID" from API Setup (not the
 *                                display number).
 *   ADMIN_WHATSAPP_NUMBER        Where new-order alerts go, e.g. 919876543210.
 *   WHATSAPP_OTP_TEMPLATE        Approved AUTHENTICATION template for OTP.
 *   WHATSAPP_ORDER_USER_TEMPLATE Approved UTILITY template for the customer's
 *                                order confirmation.
 *   WHATSAPP_ORDER_ADMIN_TEMPLATE Same, for the admin alert.
 *   WHATSAPP_TEMPLATE_LANG       Language code of those templates (en_US).
 *   WHATSAPP_API_VERSION         Graph API version (v23.0).
 *
 * Why templates matter: WhatsApp only delivers free-form text inside the
 * 24-hour window after the *recipient* last messaged the business. Every
 * message this store initiates (an OTP, an order confirmation) lands outside
 * that window, so in production each needs an approved template. The senders
 * below try the configured template first and fall back to free-form text,
 * which keeps development against test numbers working before any template
 * is approved.
 */

interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
}

function config(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

export function whatsappConfigured(): boolean {
  return config() !== null;
}

const apiVersion = () => process.env.WHATSAPP_API_VERSION || "v23.0";
const templateLang = () => process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

async function post(cfg: WhatsAppConfig, payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/${apiVersion()}/${cfg.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
    },
  );

  if (!res.ok) {
    // Meta puts the useful part ("template not found", "recipient not in
    // allowed list") in the JSON body, not the status line.
    const body = await res.text().catch(() => "");
    throw new Error(`WhatsApp API ${res.status}: ${body.slice(0, 600)}`);
  }
}

function requireConfig(): WhatsAppConfig {
  const cfg = config();
  if (!cfg) {
    throw new Error(
      "WhatsApp is not configured — set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
    );
  }
  return cfg;
}

/** Free-form text. Only delivered inside an open 24-hour customer window. */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  await post(requireConfig(), { to, type: "text", text: { preview_url: false, body } });
}

/**
 * Approved-template send. `bodyParams` fill {{1}}, {{2}}… in order.
 * `buttonParam` fills the first button's variable — the OTP for an
 * AUTHENTICATION template's copy-code button, or the dynamic path segment of
 * a UTILITY template's URL button. Same payload shape either way.
 */
export async function sendWhatsAppTemplate(
  to: string,
  name: string,
  bodyParams: string[],
  opts?: { buttonParam?: string },
): Promise<void> {
  const components: Record<string, unknown>[] = [];
  if (bodyParams.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text", text })),
    });
  }
  if (opts?.buttonParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: opts.buttonParam }],
    });
  }

  await post(requireConfig(), {
    to,
    type: "template",
    template: {
      name,
      language: { code: templateLang() },
      ...(components.length > 0 ? { components } : {}),
    },
  });
}

/**
 * Registration OTP. Throws on failure — the caller must know the code never
 * arrived so it can tell the customer, unlike the order pings below.
 */
export async function sendOtpWhatsApp(to: string, code: string): Promise<void> {
  const template = process.env.WHATSAPP_OTP_TEMPLATE;
  if (template) {
    await sendWhatsAppTemplate(to, template, [code], { buttonParam: code });
    return;
  }
  await sendWhatsAppText(
    to,
    `${code} is your WOW Lifestyle verification code. It expires in 5 minutes — don't share it with anyone.`,
  );
}

export interface OrderNotificationInput {
  /** Database id — the /admin/orders/[id] path segment for the alert button. */
  orderId: string;
  orderNumber: string;
  units: number;
  totalLabel: string;
  customerName: string;
  customerPhone: string;
}

/**
 * "Order placed" pings: confirmation to the customer, alert to the admin.
 *
 * Never throws and never blocks an order — the sale is already made; a failed
 * WhatsApp message is a log line, not a checkout error. Both sends run in
 * parallel and each falls back from template to free-form text.
 */
export async function sendOrderPlacedWhatsApp(input: OrderNotificationInput): Promise<void> {
  if (!whatsappConfigured()) return;

  const jobs: Promise<void>[] = [];

  const customerTo = canonicalPhone(input.customerPhone);
  if (customerTo) jobs.push(sendCustomerOrderPing(customerTo, input));

  const adminRaw = process.env.ADMIN_WHATSAPP_NUMBER;
  const adminTo = adminRaw ? canonicalPhone(adminRaw) : null;
  if (adminTo) jobs.push(sendAdminOrderPing(adminTo, input));

  for (const result of await Promise.allSettled(jobs)) {
    if (result.status === "rejected") {
      console.error("WhatsApp order notification failed:", result.reason);
    }
  }
}

/**
 * Order status update to the customer ("shipped", "delivered", "cancelled").
 * Never throws — a failed message must not fail the admin's status change.
 */
export async function sendOrderStatusWhatsApp(input: {
  phone: string;
  orderNumber: string;
  status: "SHIPPED" | "DELIVERED" | "CANCELLED";
  name?: string | null;
}): Promise<void> {
  if (!whatsappConfigured()) return;
  const to = canonicalPhone(input.phone);
  if (!to) return;

  const hello = input.name ? `Hi ${input.name}! ` : "";
  const messages: Record<typeof input.status, string> = {
    SHIPPED: `${hello}🚚 Your order ${input.orderNumber} has been shipped and is on its way. We'll let you know once it's delivered. — WOW Lifestyle`,
    DELIVERED: `${hello}✅ Your order ${input.orderNumber} has been delivered. We hope you love it! Reply here if anything isn't right. — WOW Lifestyle`,
    CANCELLED: `${hello}Your order ${input.orderNumber} has been cancelled. If this wasn't expected, reply here and we'll sort it out. — WOW Lifestyle`,
  };

  try {
    await sendWhatsAppText(to, messages[input.status]);
  } catch (err) {
    console.error("WhatsApp status update failed:", err);
  }
}

/** Template params: {{1}} customer name, {{2}} order number, {{3}} total. */
async function sendCustomerOrderPing(to: string, i: OrderNotificationInput): Promise<void> {
  const template = process.env.WHATSAPP_ORDER_USER_TEMPLATE;
  if (template) {
    try {
      await sendWhatsAppTemplate(to, template, [i.customerName, i.orderNumber, i.totalLabel]);
      return;
    } catch (err) {
      console.error("Customer order template failed, trying free-form text:", err);
    }
  }
  await sendWhatsAppText(
    to,
    `Hi ${i.customerName}! 🎉 Your order ${i.orderNumber} has been placed successfully.\n` +
      `Total: ${i.totalLabel}\n\n` +
      `We'll message you here as soon as it ships. Thank you for shopping with WOW Lifestyle!`,
  );
}

/**
 * Template params: {{1}} order number, {{2}} units, {{3}} total,
 * {{4}} customer name, {{5}} customer phone; the template's "View Order"
 * URL button gets the order's database id as its dynamic path segment.
 */
async function sendAdminOrderPing(to: string, i: OrderNotificationInput): Promise<void> {
  const orderUrl = `${siteUrl()}/admin/orders/${i.orderId}`;
  const template = process.env.WHATSAPP_ORDER_ADMIN_TEMPLATE;
  if (template) {
    try {
      await sendWhatsAppTemplate(
        to,
        template,
        [i.orderNumber, String(i.units), i.totalLabel, i.customerName, i.customerPhone],
        { buttonParam: i.orderId },
      );
      return;
    } catch (err) {
      console.error("Admin order template failed, trying free-form text:", err);
    }
  }
  await sendWhatsAppText(
    to,
    `🛒 New order ${i.orderNumber}\n` +
      `${i.units} ${i.units === 1 ? "unit" : "units"} · ${i.totalLabel}\n` +
      `Customer: ${i.customerName} (${i.customerPhone})\n` +
      `View order: ${orderUrl}`,
  );
}
