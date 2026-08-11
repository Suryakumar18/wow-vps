import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { canonicalPhone } from "@/app/server/phone";
import { sendWhatsAppText, whatsappConfigured } from "@/app/server/whatsapp";
import { siteUrl } from "@/app/server/env";

/**
 * WhatsApp the offer to every mobile number the store knows — registered
 * customers, saved addresses and past orders' shipping numbers, deduplicated
 * on canonical form.
 *
 * `?dryRun=1` only counts the audience, so the admin sees "will reach N
 * numbers" before committing. Note WhatsApp's own rules still apply: outside
 * an open 24-hour window, free-form texts like this only land for recipients
 * who've messaged the business — a marketing TEMPLATE is the reliable path
 * for cold sends (see WHATSAPP_SETUP.md).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [users, addresses, orders] = await Promise.all([
    prisma.user.findMany({ where: { phone: { not: null } }, select: { phone: true } }),
    prisma.address.findMany({ select: { phone: true } }),
    prisma.order.findMany({ select: { addressPhone: true } }),
  ]);

  const audience = new Set<string>();
  for (const raw of [
    ...users.map((u) => u.phone ?? ""),
    ...addresses.map((a) => a.phone),
    ...orders.map((o) => o.addressPhone),
  ]) {
    const phone = canonicalPhone(raw);
    if (phone) audience.add(phone);
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  if (dryRun) return NextResponse.json({ ok: true, audience: audience.size, sent: 0, failed: 0 });

  if (!whatsappConfigured()) {
    return NextResponse.json({ error: "WhatsApp isn't configured." }, { status: 503 });
  }

  const message =
    `🎉 ${offer.title} — ${offer.percent}% OFF on everything at WOW Lifestyle!` +
    (offer.couponCode ? `\nUse coupon ${offer.couponCode} at checkout for extra savings.` : "") +
    `\nShop now: ${siteUrl()}`;

  let sent = 0;
  let failed = 0;
  const numbers = [...audience];
  // Small parallel batches — enough throughput without hammering the API.
  for (let i = 0; i < numbers.length; i += 5) {
    const results = await Promise.allSettled(
      numbers.slice(i, i + 5).map((to) => sendWhatsAppText(to, message)),
    );
    for (const result of results) {
      if (result.status === "fulfilled") sent += 1;
      else failed += 1;
    }
  }

  return NextResponse.json({ ok: true, audience: audience.size, sent, failed });
}
