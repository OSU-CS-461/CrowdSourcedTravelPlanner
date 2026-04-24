-- CreateTable
CREATE TABLE "UserLikedExperience" (
    "userId" INTEGER NOT NULL,
    "experienceId" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLikedExperience_pkey" PRIMARY KEY ("userId","experienceId")
);

-- CreateTable
CREATE TABLE "UserLikedTag" (
    "userId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLikedTag_pkey" PRIMARY KEY ("userId","tagId")
);

-- CreateIndex
CREATE INDEX "UserLikedExperience_experienceId_idx" ON "UserLikedExperience"("experienceId");

-- CreateIndex
CREATE INDEX "UserLikedExperience_userId_dateCreated_idx" ON "UserLikedExperience"("userId", "dateCreated");

-- CreateIndex
CREATE INDEX "UserLikedTag_tagId_idx" ON "UserLikedTag"("tagId");

-- CreateIndex
CREATE INDEX "UserLikedTag_userId_dateCreated_idx" ON "UserLikedTag"("userId", "dateCreated");

-- AddForeignKey
ALTER TABLE "UserLikedExperience" ADD CONSTRAINT "UserLikedExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikedExperience" ADD CONSTRAINT "UserLikedExperience_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikedTag" ADD CONSTRAINT "UserLikedTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikedTag" ADD CONSTRAINT "UserLikedTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
