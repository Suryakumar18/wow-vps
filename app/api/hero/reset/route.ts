import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Hero from "@/lib/models/Hero";
import { requireAdmin } from "@/lib/auth";

// No bundled placeholder assets exist for these — add real ones via the
// Hero admin page (Carousel Images / Brand Logos), which uploads to the VPS.
const DEFAULT_BRANDS: { name: string; src: string }[] = [];
const DEFAULT_CARS: string[] = [];

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  await Hero.deleteMany({});
  const config = await Hero.create({
    badgeText: "OFFICIAL F1 COLLECTOR SERIES",
    title: "Race Ready.",
    titleGradient: "Miniature Speed.",
    description: "Experience the thrill of the track with our ultra-realistic, precision-engineered diecast Formula 1 collection.",
    primaryButtonText: "Shop Collection",
    secondaryButtonText: "View Gallery",
    carImages: DEFAULT_CARS,
    brands: DEFAULT_BRANDS,
  });

  return Response.json({ success: true, message: "Hero configuration reset to defaults", data: config });
}
