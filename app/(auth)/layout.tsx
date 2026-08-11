import { Dancing_Script } from "next/font/google";
import { BadgeCheck, MessageCircle, Truck } from "lucide-react";
import AuthAside from "@/app/components-home/auth/AuthAside";

const script = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-script",
  display: "swap",
});

const TRUST = [
  { icon: BadgeCheck, label: "100% Genuine Products" },
  { icon: MessageCircle, label: "WhatsApp Support" },
  { icon: Truck, label: "Fast & Safe Delivery" },
];

/**
 * Auth shell: the promise panel on the left from `lg`, the form on the right
 * on a clean white ground with a whisper of warmth at the top, and the
 * store's trust strip under the card. Deliberately restrained — these
 * screens handle credentials, so they look like business, not confetti.
 *
 * No storefront chrome — no header, nav, footer or bottom bar — so nothing
 * competes with the single task on the page.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${script.variable} grid min-h-screen bg-white text-ink lg:grid-cols-[0.8fr_1fr] xl:grid-cols-[1fr_1fr]`}
    >
      <AuthAside />
      <main className="relative flex items-center justify-center px-gutter py-8 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-gold-50/70 to-transparent"
        />
        <div className="relative w-full max-w-[26rem]">
          {children}

          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-line pt-5">
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-mist text-gold-600">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="text-nano leading-tight text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
