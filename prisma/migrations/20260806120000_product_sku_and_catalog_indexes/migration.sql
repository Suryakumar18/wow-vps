-- The trigram GIN index below cannot be created without this extension.
-- Supabase ships it; on a self-hosted Postgres it needs contrib installed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- AlterTable
ALTER TABLE "products" ADD COLUMN     "sku" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_isPublished_categoryId_createdAt_idx" ON "products"("isPublished", "categoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_isPublished_categoryId_price_idx" ON "products"("isPublished", "categoryId", "price");

-- CreateIndex
CREATE INDEX "products_isPublished_subcategoryId_createdAt_idx" ON "products"("isPublished", "subcategoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_isPublished_createdAt_idx" ON "products"("isPublished", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_isPublished_price_idx" ON "products"("isPublished", "price");

-- CreateIndex
CREATE INDEX "products_isPublished_isFeatured_idx" ON "products"("isPublished", "isFeatured");

-- CreateIndex
CREATE INDEX "products_isPublished_isDeal_idx" ON "products"("isPublished", "isDeal");

-- CreateIndex
CREATE INDEX "products_title_idx" ON "products" USING GIN ("title" gin_trgm_ops);

