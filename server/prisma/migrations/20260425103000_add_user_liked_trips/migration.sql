-- CreateTable
CREATE TABLE "UserLikedTrip" (
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLikedTrip_pkey" PRIMARY KEY ("userId","tripId")
);

-- CreateIndex
CREATE INDEX "UserLikedTrip_tripId_idx" ON "UserLikedTrip"("tripId");

-- CreateIndex
CREATE INDEX "UserLikedTrip_userId_dateCreated_idx" ON "UserLikedTrip"("userId", "dateCreated");

-- AddForeignKey
ALTER TABLE "UserLikedTrip" ADD CONSTRAINT "UserLikedTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLikedTrip" ADD CONSTRAINT "UserLikedTrip_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
