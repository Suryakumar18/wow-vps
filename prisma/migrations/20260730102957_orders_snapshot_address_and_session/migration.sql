/*
  Warnings:

  - You are about to drop the column `addressId` on the `orders` table. All the data in the column will be lost.
  - Added the required column `addressLabel` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressLine` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressPhone` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_addressId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "addressId",
ADD COLUMN     "addressLabel" TEXT NOT NULL,
ADD COLUMN     "addressLine" TEXT NOT NULL,
ADD COLUMN     "addressName" TEXT,
ADD COLUMN     "addressPhone" TEXT NOT NULL,
ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "orders_sessionId_idx" ON "orders"("sessionId");
