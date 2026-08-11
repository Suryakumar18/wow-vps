import { Dancing_Script } from "next/font/google";
import AuthAside from "@/app/components-home/auth/AuthAside";

const script = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-script",
  display: "swap",
});

/**
 * Auth shell: the promise panel on the left from `lg`, the form on the right.
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
      <main className="flex items-center justify-center px-gutter py-8 sm:py-12">
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  );
}
