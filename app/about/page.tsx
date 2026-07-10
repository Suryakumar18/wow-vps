import type { Metadata } from "next";
import ToyBlogLifestyle from './ToyBlogLifestyle';

export const metadata: Metadata = {
  title: "About WOW Lifestyle Thuriur",
  description: "Learn about WOW Lifestyle Thuriur — India's premier destination for premium toys, diecast models, RC cars, drones, LEGO, and collectibles in Tamil Nadu.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About WOW Lifestyle Thuriur",
    description: "India's premier destination for premium toys and collectibles based in Thuriur, Tamil Nadu.",
    url: "/about",
  },
};

export default function AboutPage() {
  return <ToyBlogLifestyle />;
}