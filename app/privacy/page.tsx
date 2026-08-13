import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicySection, PolicyList } from "@/app/components-home/PolicyPage";
import { BRAND, TELEPHONE } from "@/app/seo";

/**
 * Privacy policy.
 *
 * Written against what the code actually does rather than from a template:
 * every field listed under "What we collect" maps to a real column, and every
 * third party listed is one the app really calls. Meta requires a reachable
 * privacy-policy URL before a WhatsApp app can be published, and this is it.
 */

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

const SUPPORT_EMAIL = "support@wowlifestyle.online";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      updated="13 August 2026"
      intro={
        <p>
          This policy explains what personal information {BRAND} collects when you use{" "}
          <span className="font-medium text-ink">wowlifestyle.online</span>, why we collect it, who
          we share it with, and the choices you have. We have kept it specific to what this store
          actually does rather than filling it with generalities.
        </p>
      }
    >
      <PolicySection heading="1. Who we are">
        <p>
          {BRAND} is an online toy and hobby retailer serving customers across India, with a
          store at Texvalley, Erode, Tamil Nadu. We operate the online store at
          wowlifestyle.online. For anything in this policy you can reach us on {TELEPHONE} or at{" "}
          {SUPPORT_EMAIL}.
        </p>
      </PolicySection>

      <PolicySection heading="2. What we collect">
        <p>We only collect what an order or an account actually needs:</p>
        <PolicyList
          items={[
            <>
              <span className="font-medium text-ink">Account details</span> — your name, email
              address and mobile number. Your password is stored only as a one-way hash; we never
              hold it in a readable form and cannot recover it for you.
            </>,
            <>
              <span className="font-medium text-ink">Delivery details</span> — the recipient name,
              mobile number and address (street, city, state and PIN code) you enter at checkout.
            </>,
            <>
              <span className="font-medium text-ink">Order records</span> — the items, quantities
              and amounts of each order, along with a snapshot of the delivery address as it stood
              when the order was placed.
            </>,
            <>
              <span className="font-medium text-ink">Phone verification</span> — your mobile number
              and a one-way hash of the one-time code we send. The code itself is never stored, and
              these records expire within minutes.
            </>,
            <>
              <span className="font-medium text-ink">Reviews</span> — the display name, rating and
              text you choose to submit against a product.
            </>,
            <>
              <span className="font-medium text-ink">Technical data</span> — the cookies described
              in section 4, plus ordinary server logs (IP address, browser type, pages requested)
              kept for security and troubleshooting.
            </>,
          ]}
        />
        <p>
          We do <span className="font-medium text-ink">not</span> collect or store your card number,
          CVV, UPI PIN or bank credentials at any point. See section 5.
        </p>
      </PolicySection>

      <PolicySection heading="3. How we use it">
        <PolicyList
          items={[
            "To take payment for, pack, and deliver your order.",
            "To send you order confirmations and delivery updates, by WhatsApp and on this site.",
            "To verify your mobile number when you register, so accounts cannot be created against someone else's number.",
            "To let you sign in, and to keep your cart and wishlist attached to you between visits.",
            "To answer your questions and handle problems with an order.",
            "To meet our tax and accounting obligations.",
          ]}
        />
        <p>
          We do not use your details for automated decision-making or profiling, and we do not run
          third-party advertising trackers on this site.
        </p>
      </PolicySection>

      <PolicySection heading="4. Cookies">
        <p>This site sets two cookies, both server-side only (your browser scripts cannot read them):</p>
        <PolicyList
          items={[
            <>
              <span className="font-medium text-ink">wow_session</span> — an anonymous identifier
              that keeps your cart, wishlist and guest orders attached to your browser. It contains
              no personal information and lasts up to one year.
            </>,
            <>
              <span className="font-medium text-ink">session</span> — issued only when you sign in,
              so the site knows it is you on the next page. Removed when you sign out.
            </>,
          ]}
        />
        <p>
          You can clear these at any time through your browser settings. Clearing them empties your
          cart and signs you out.
        </p>
      </PolicySection>

      <PolicySection heading="5. Payments">
        <p>
          Card, UPI and netbanking payments are handled entirely by{" "}
          <span className="font-medium text-ink">Razorpay</span>, a payment gateway regulated in
          India. Your payment details are entered on Razorpay&apos;s own secure form and are never
          transmitted to or stored on our servers. We keep only the reference identifiers Razorpay
          returns for an order, which let us confirm that a payment succeeded and trace it if there
          is a dispute. Razorpay handles that data under its own privacy policy.
        </p>
      </PolicySection>

      <PolicySection heading="6. Who else sees your data">
        <p>We share the minimum necessary with the following, and with nobody else:</p>
        <PolicyList
          items={[
            <>
              <span className="font-medium text-ink">Razorpay</span> — to take and verify payment.
            </>,
            <>
              <span className="font-medium text-ink">Meta Platforms (WhatsApp Business Platform)</span>{" "}
              — your mobile number and order reference, so we can send verification codes and order
              updates to your WhatsApp.
            </>,
            <>
              <span className="font-medium text-ink">Our hosting and database providers</span> — the
              servers that run this store and hold its records on our behalf.
            </>,
            <>
              <span className="font-medium text-ink">Delivery partners</span> — the recipient name,
              address and phone number needed to deliver your parcel.
            </>,
          ]}
        />
        <p className="font-medium text-ink">
          We do not sell, rent or trade your personal information to anyone, for any purpose.
        </p>
        <p>
          We may also disclose information where we are legally required to — for example in
          response to a valid order from a court or a competent authority.
        </p>
      </PolicySection>

      <PolicySection heading="7. Where your data is held">
        <p>
          Our database is hosted on managed infrastructure in the Asia-Pacific (Singapore) region,
          and product images and site files are stored on our own server. Because some of our
          providers operate outside India, your information may be processed abroad; where that
          happens we rely on the provider&apos;s contractual data-protection commitments.
        </p>
      </PolicySection>

      <PolicySection heading="8. WhatsApp messages">
        <p>
          If you give us your mobile number, we use it to send transactional WhatsApp messages only
          — a verification code when you register, a confirmation when you order, and updates when
          the order ships, is delivered or is cancelled. We do not send marketing broadcasts to
          customers who have not asked for them. To stop receiving these, reply to the message or
          contact us on {TELEPHONE} and we will remove your number.
        </p>
      </PolicySection>

      <PolicySection heading="9. How long we keep it">
        <p>
          Order and invoice records are kept for as long as tax and company law requires. Account
          details are kept while your account is open. Phone verification records expire within
          minutes. Anonymous cart and wishlist data is cleared once it has been inactive for a
          period, or as soon as you clear your cookies.
        </p>
      </PolicySection>

      <PolicySection heading="10. Your rights">
        <p>You can ask us at any time to:</p>
        <PolicyList
          items={[
            "Give you a copy of the personal information we hold about you.",
            "Correct anything that is wrong or out of date.",
            "Delete your account and personal details, except records we must keep by law (such as completed invoices).",
            "Stop sending you WhatsApp messages.",
          ]}
        />
        <p>
          Write to {SUPPORT_EMAIL} or call {TELEPHONE}. We will verify who you are before acting on
          the request, and respond within a reasonable period.
        </p>
      </PolicySection>

      <PolicySection heading="11. Security">
        <p>
          The site is served over HTTPS, passwords are stored only as hashes, session cookies are
          not readable by browser scripts, and administrative access to the store is restricted. No
          system is perfectly secure, but if a breach ever affects your personal information we
          will tell you and the relevant authority as required by law.
        </p>
      </PolicySection>

      <PolicySection heading="12. Children">
        <p>
          We sell toys, but the store is intended to be used by adults. We do not knowingly create
          accounts for, or collect personal information from, children under 18. If you believe a
          child has given us their details, contact us and we will delete them.
        </p>
      </PolicySection>

      <PolicySection heading="13. Changes to this policy">
        <p>
          If we change how we handle personal information we will update this page and change the
          date at the top. Material changes will be highlighted on the site.
        </p>
      </PolicySection>

      <PolicySection heading="14. Contact us">
        <p>
          {BRAND} — Texvalley, Erode, Tamil Nadu, India.
          <br />
          Phone: {TELEPHONE}
          <br />
          Email: {SUPPORT_EMAIL}
        </p>
        <p>
          See also our{" "}
          <Link href="/refund-policy" className="font-medium text-ink underline underline-offset-2">
            Returns &amp; Refunds Policy
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
