import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicySection, PolicyList } from "@/app/components-home/PolicyPage";
import { BRAND, TELEPHONE } from "@/app/seo";

/**
 * Returns & Refunds.
 *
 * The shop's stated position is that refunds are not offered, and that is what
 * this page says. The one exception kept in — a parcel that arrives damaged,
 * wrong or never arrives — is deliberate: a blanket "no refunds under any
 * circumstances" is not enforceable against defective goods under the Consumer
 * Protection Act 2019, and payment gateways require a stated remedy for
 * non-delivery. Narrow it further only with the owner's explicit say-so.
 */

export const metadata: Metadata = {
  title: "Returns & Refunds Policy",
  description: `${BRAND} does not offer refunds or exchanges on delivered orders. Read the full policy, including what happens if an item arrives damaged or incorrect.`,
  alternates: { canonical: "/refund-policy" },
};

const SUPPORT_EMAIL = "support@wowlifestyle.online";

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Returns & Refunds Policy"
      updated="13 August 2026"
      intro={
        <p>
          Please read this page before you order. {BRAND} operates a{" "}
          <span className="font-medium text-ink">no-refund policy</span>: once an order has been
          placed and delivered, it cannot be returned, exchanged or refunded. The only exceptions
          are set out in section 3.
        </p>
      }
    >
      <PolicySection heading="1. No refunds or exchanges">
        <p>
          All sales at {BRAND} are final. We do not accept returns, offer exchanges, or issue
          refunds on delivered orders. This includes, but is not limited to:
        </p>
        <PolicyList
          items={[
            "Change of mind after ordering or after delivery.",
            "Ordering the wrong item, colour, scale or variant by mistake.",
            "The product not matching a personal expectation of size, speed, finish or performance where it matches the description and photographs on the product page.",
            "Gifts that the recipient did not want.",
            "Items opened, assembled, charged, run or otherwise used.",
            "Missing or damaged original packaging.",
          ]}
        />
        <p>
          Because of this, please check the photographs, description and specifications on the
          product page carefully before ordering, and ask us anything you are unsure about first.
          We are happy to answer questions on {TELEPHONE} before you buy.
        </p>
      </PolicySection>

      <PolicySection heading="2. Cancelling an order">
        <p>
          An order can be cancelled only while it is still being processed and has not yet been
          dispatched. Contact us as quickly as possible on {TELEPHONE} with your order number. Once
          an order has been handed to the delivery partner it can no longer be cancelled.
        </p>
        <p>
          Where a prepaid order is cancelled before dispatch, the amount paid is returned to the
          original payment method. Depending on your bank, that can take up to 7 working days to
          appear.
        </p>
      </PolicySection>

      <PolicySection heading="3. If something is genuinely wrong">
        <p>
          The no-refund rule does not apply where we are at fault or your parcel does not reach you.
          We will put it right if:
        </p>
        <PolicyList
          items={[
            "The item arrives physically damaged or broken.",
            "You receive the wrong product, or a product materially different from what was shown and described on its page.",
            "The parcel is never delivered, or is lost in transit.",
            "The item is dead on arrival — it does not power on or function at all when first used.",
          ]}
        />
        <p className="font-medium text-ink">
          You must tell us within 48 hours of delivery, and send clear photographs or a video of the
          item and its packaging.
        </p>
        <p>
          Please film yourself opening the parcel where you can — an unedited unboxing video is the
          quickest way for us to accept a damage or wrong-item claim. Once we have verified the
          problem we will, at our discretion, replace the item, send the correct one, or refund you.
          Claims raised after 48 hours, or without evidence, cannot be accepted.
        </p>
      </PolicySection>

      <PolicySection heading="4. Manufacturer defects and warranty">
        <p>
          Some products carry a manufacturer&apos;s warranty. Where they do, a fault appearing after
          the 48-hour window is handled under that warranty rather than by us, and we will help you
          contact the manufacturer or service centre. Ordinary wear, crash damage, water damage,
          worn batteries and damage from misuse are not covered.
        </p>
      </PolicySection>

      <PolicySection heading="5. How to raise a claim">
        <p>Contact us with all of the following:</p>
        <PolicyList
          items={[
            "Your order number.",
            "A description of the problem.",
            "Photographs or video clearly showing the item and the packaging it arrived in.",
          ]}
        />
        <p>
          Phone or WhatsApp {TELEPHONE}, or email {SUPPORT_EMAIL}. We will confirm within a
          reasonable period whether the claim is accepted and what happens next.
        </p>
      </PolicySection>

      <PolicySection heading="6. Approved refunds">
        <p>
          Where we do approve a refund under section 3, it is returned to the original payment
          method. Once we issue it, the amount typically reaches your account within 5–7 working
          days, depending on your bank or card issuer. Cash-on-delivery orders are refunded by bank
          transfer or UPI to details you provide.
        </p>
      </PolicySection>

      <PolicySection heading="7. Contact">
        <p>
          {BRAND} — Texvalley, Erode, Tamil Nadu, India.
          <br />
          Phone / WhatsApp: {TELEPHONE}
          <br />
          Email: {SUPPORT_EMAIL}
        </p>
        <p>
          See also our{" "}
          <Link href="/privacy" className="font-medium text-ink underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
