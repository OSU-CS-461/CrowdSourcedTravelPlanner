-- Add denormalized review stats used by Home feed ranking.
ALTER TABLE "Experience"
  ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "mostRecentReviewAt" TIMESTAMP(3);

-- Backfill stats for experiences with reviews.
WITH review_agg AS (
  SELECT
    r."experienceId" AS "experienceId",
    COUNT(*)::INTEGER AS "reviewCount",
    AVG(r."rating")::DOUBLE PRECISION AS "avgRating",
    MAX(r."dateCreated") AS "mostRecentReviewAt"
  FROM "Review" r
  GROUP BY r."experienceId"
)
UPDATE "Experience" e
SET
  "reviewCount" = a."reviewCount",
  "avgRating" = a."avgRating",
  "mostRecentReviewAt" = a."mostRecentReviewAt"
FROM review_agg a
WHERE e."id" = a."experienceId";

-- Ensure experiences without reviews are normalized consistently.
UPDATE "Experience" e
SET
  "reviewCount" = 0,
  "avgRating" = NULL,
  "mostRecentReviewAt" = NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM "Review" r
  WHERE r."experienceId" = e."id"
);

CREATE INDEX "Experience_mostRecentReviewAt_idx" ON "Experience"("mostRecentReviewAt");
CREATE INDEX "Experience_mostRecentReviewAt_avgRating_idx" ON "Experience"("mostRecentReviewAt", "avgRating");
