-- Social-media video links attached to a product (YouTube, Instagram,
-- Facebook, X). Kept separate from product_videos, which holds files uploaded
-- to our own server and played by the gallery.
CREATE TABLE "product_social_videos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_social_videos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_social_videos_productId_idx" ON "product_social_videos"("productId");

ALTER TABLE "product_social_videos"
  ADD CONSTRAINT "product_social_videos_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
