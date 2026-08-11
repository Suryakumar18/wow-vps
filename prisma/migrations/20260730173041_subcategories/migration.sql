-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "showInNav" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "subcategoryId" TEXT;

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subcategories_categoryId_position_idx" ON "subcategories"("categoryId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_categoryId_slug_key" ON "subcategories"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "products_subcategoryId_idx" ON "products"("subcategoryId");

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
