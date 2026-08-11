import { Dancing_Script } from "next/font/google";
import { BadgeCheck, MessageCircle, Truck } from "lucide-react";
import AuthAside from "@/app/components-home/auth/AuthAside";
import AuthDecor from "@/app/components-home/auth/AuthDecor";

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
 * over a softly animated toy backdrop, with the store's trust strip filling
 * the space below the card.
 *
 * These screens deliberately skip the storefront chrome — no header, nav,
 * footer or bottom bar — so nothing competes with the single task on the page.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${script.variable} grid min-h-screen bg-white text-ink lg:grid-cols-[0.8fr_1fr] xl:grid-cols-[1fr_1fr]`}
    >
      <AuthAside />
      <main className="relative flex items-center justify-center overflow-hidden px-gutter py-8 sm:py-12">
        <AuthDecor />
        <div className="relative w-full max-w-[26rem]">
          {children}

          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-line pt-5">
            {TRUST.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-50 text-gold-600">
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
