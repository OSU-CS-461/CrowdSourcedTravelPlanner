/*
  Warnings:

  - You are about to drop the column `parentCategoryId` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Tag` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_parentCategoryId_fkey";

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "categoryId" INTEGER,
ALTER COLUMN "lastUpdated" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "parentCategoryId",
DROP COLUMN "type",
ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "TagType";

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
