import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wowlifestyle.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/testimonials`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    await connectDB();
    const products = await Product.find({ isActive: true }, "_id updatedAt").lean() as any[];
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${APP_URL}/product/${p._id}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
