import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View and track your orders at WOW Lifestyle Thuriur.",
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
