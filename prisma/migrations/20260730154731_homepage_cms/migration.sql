-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('PROMO', 'LIFESTYLE');

-- CreateEnum
CREATE TYPE "BannerTone" AS ENUM ('DARK', 'LIGHT', 'CREAM');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "titleLine1" TEXT NOT NULL,
    "titleLine2" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "scriptWords" TEXT[],
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "placement" "BannerPlacement" NOT NULL,
    "tone" "BannerTone" NOT NULL DEFAULT 'DARK',
    "eyebrow" TEXT,
    "titleLine1" TEXT NOT NULL,
    "titleLine2" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_placement_position_idx" ON "banners"("placement", "position");
