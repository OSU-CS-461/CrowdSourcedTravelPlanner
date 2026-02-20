/*
  Warnings:

  - Made the column `latitude` on table `Experience` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Experience` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
DELETE FROM "Experience"
WHERE "latitude" IS NULL OR "longitude" IS NULL;


ALTER TABLE "Experience" ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL;
