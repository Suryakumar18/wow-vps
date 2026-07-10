import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await connectDB();
    const { productId } = await params;
    const product = await Product.findById(productId).lean() as any;
    if (!product) {
      return { title: "Product Not Found", robots: { index: false, follow: false } };
    }
    const title = product.title as string;
    const description = (product.description || product.aboutDescription || `Buy ${title} at WOW Lifestyle Thuriur. Premium toys and collectibles with fast delivery across India.`) as string;
    const image = (Array.isArray(product.images) && product.images[0]) || product.imageUrl || "/og-image.jpg";
    return {
      title,
      description: description.slice(0, 160),
      alternates: { canonical: `/product/${productId}` },
      openGraph: {
        title: `${title} | WOW Lifestyle Thuriur`,
        description: description.slice(0, 160),
        url: `/product/${productId}`,
        images: [{ url: image, width: 800, height: 800, alt: title }],
      },
    };
  } catch {
    return { title: "Product | WOW Lifestyle Thuriur" };
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
