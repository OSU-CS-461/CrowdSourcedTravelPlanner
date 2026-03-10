-- DropForeignKey
ALTER TABLE "TripExperience" DROP CONSTRAINT IF EXISTS "TripExperience_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "TripExperience" DROP CONSTRAINT IF EXISTS "TripExperience_tripId_fkey";

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "keywords" TEXT[];

-- AlterTable
ALTER TABLE "Interest" ALTER COLUMN "lastUpdated" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Experience_createdBy_idx" ON "Experience"("createdBy");

-- CreateIndex
CREATE INDEX "Experience_categoryId_idx" ON "Experience"("categoryId");

-- CreateIndex
CREATE INDEX "Review_experienceId_idx" ON "Review"("experienceId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Trip_createdBy_idx" ON "Trip"("createdBy");

-- CreateIndex
CREATE INDEX "TripExperience_experienceId_idx" ON "TripExperience"("experienceId");

-- AddForeignKey
ALTER TABLE "TripExperience" ADD CONSTRAINT "TripExperience_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripExperience" ADD CONSTRAINT "TripExperience_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
