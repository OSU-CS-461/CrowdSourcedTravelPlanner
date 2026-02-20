/*
  Warnings:

  - You are about to drop the column `category` on the `Tag` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('CATEGORY', 'FEATURE');

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "category",
ADD COLUMN     "parentCategoryId" INTEGER,
ADD COLUMN     "type" "TagType";

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
