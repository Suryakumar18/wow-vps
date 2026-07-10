import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "WOW Lifestyle Thuriur offers retail and wholesale services for premium toys, diecast models, RC cars, LEGO, and collectibles. Special discounts for bulk orders and business partners.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Services | WOW Lifestyle Thuriur",
    description: "Retail and wholesale toy services with special discounts. Business partners get up to 50% off on bulk orders.",
    url: "/services",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
