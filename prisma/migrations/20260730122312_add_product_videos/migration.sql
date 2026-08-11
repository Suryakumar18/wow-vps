-- CreateTable
CREATE TABLE "product_videos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_videos_productId_idx" ON "product_videos"("productId");

-- AddForeignKey
ALTER TABLE "product_videos" ADD CONSTRAINT "product_videos_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
