import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Hero from "@/lib/models/Hero";
import { requireAdmin } from "@/lib/auth";

// No bundled placeholder assets exist for these — add real ones via the
// Hero admin page (Carousel Images / Brand Logos), which uploads to the VPS.
const DEFAULT_BRANDS: { name: string; src: string }[] = [];
const DEFAULT_CARS: string[] = [];

export async function GET() {
  await connectDB();
  let config = await Hero.getConfig();

  const cleanBrands = config.brands.filter((b) => !b.src.includes("placeholder.com"));
  const cleanCars   = config.carImages.filter((c) => !c.includes("placeholder.com"));
  const needsUpdate = cleanBrands.length !== config.brands.length || cleanCars.length !== config.carImages.length;

  if (needsUpdate) {
    // Atomic update — avoids the optimistic-concurrency VersionError that a
    // fetch-then-.save() pattern is prone to under concurrent requests.
    config = await Hero.findOneAndUpdate(
      { _id: config._id },
      {
        brands:    cleanBrands.length ? cleanBrands : DEFAULT_BRANDS,
        carImages: cleanCars.length   ? cleanCars   : DEFAULT_CARS,
      },
      { new: true }
    ) ?? config;
  }

  return Response.json({ success: true, data: config });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const body = await req.json();
  const { badgeText, title, titleGradient, description, primaryButtonText, secondaryButtonText, carImages, brands } = body;

  if (!badgeText || !title || !titleGradient || !description || !primaryButtonText || !secondaryButtonText) {
    return Response.json({ success: false, message: "Please provide all required text fields" }, { status: 400 });
  }
  if (!Array.isArray(carImages) || !Array.isArray(brands)) {
    return Response.json({ success: false, message: "carImages and brands must be arrays" }, { status: 400 });
  }

  // Strip placeholder.com URLs before saving
  body.brands = brands.filter((b: { src: string }) => !b.src.includes("placeholder.com"));
  body.carImages = carImages.filter((c: string) => !c.includes("placeholder.com"));

  // Atomic upsert — no version check, so a stale client-held copy of the
  // config (e.g. from before another save landed) can never hit a VersionError.
  const config = await Hero.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  return Response.json({ success: true, message: "Hero configuration saved successfully", data: config });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  await Hero.deleteMany({});
  const config = await Hero.getConfig();
  return Response.json({ success: true, message: "Hero configuration reset to defaults", data: config });
}
