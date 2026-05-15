ALTER TABLE "Tag" ADD COLUMN "normalizedLabel" TEXT;

UPDATE "Tag"
SET "normalizedLabel" = trim(regexp_replace(lower("label"), '[^a-z0-9]+', ' ', 'g'));

ALTER TABLE "Tag" ALTER COLUMN "normalizedLabel" SET NOT NULL;

CREATE UNIQUE INDEX "Tag_categoryId_normalizedLabel_key" ON "Tag"("categoryId", "normalizedLabel");
