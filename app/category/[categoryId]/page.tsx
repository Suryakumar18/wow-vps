import type { Metadata } from "next";
import CategoryPageClient from "./CategoryPageClient";

interface Props {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  // Convert slug-style IDs to readable names (e.g. "rc-cars" → "RC Cars")
  const categoryName = categoryId
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${categoryName} | Shop at WOW Lifestyle Thuriur`,
    description: `Browse our ${categoryName} collection at WOW Lifestyle Thuriur. Premium toys, diecast models, RC cars, LEGO, and collectibles with fast delivery across India.`,
    alternates: { canonical: `/category/${categoryId}` },
    openGraph: {
      title: `${categoryName} | WOW Lifestyle Thuriur`,
      description: `Shop ${categoryName} at WOW Lifestyle Thuriur — India's premier toy store.`,
      url: `/category/${categoryId}`,
    },
  };
}

export default function CategoryPage() {
  return <CategoryPageClient />;
}
