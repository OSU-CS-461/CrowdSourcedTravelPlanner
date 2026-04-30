/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endDate` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropIndex
DROP INDEX "Review_userId_experienceId_key";

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Image";

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
