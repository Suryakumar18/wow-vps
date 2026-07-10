import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Testimonials",
  description: "Read what customers say about WOW Lifestyle Thuriur. Trusted by thousands of toy enthusiasts across India for premium toys, diecast models, RC cars, and collectibles.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Customer Testimonials | WOW Lifestyle Thuriur",
    description: "Trusted by thousands of toy enthusiasts across India. Read genuine customer reviews.",
    url: "/testimonials",
  },
};

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
