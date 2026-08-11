-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "imageAlt" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shortTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "titleLine1" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "titleLine2" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'General',
    "multiline" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "sublabel" TEXT,
    "href" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "extra" TEXT,
    "parentId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_settings_group_idx" ON "site_settings"("group");

-- CreateIndex
CREATE INDEX "content_items_group_position_idx" ON "content_items"("group", "position");

-- CreateIndex
CREATE INDEX "content_items_parentId_idx" ON "content_items"("parentId");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
