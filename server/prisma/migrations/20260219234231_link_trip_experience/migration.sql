-- CreateTable
CREATE TABLE "TripExperience" (
    "tripId" INTEGER NOT NULL,
    "experienceId" INTEGER NOT NULL,

    CONSTRAINT "TripExperience_pkey" PRIMARY KEY ("tripId","experienceId")
);

-- AddForeignKey
ALTER TABLE "TripExperience" ADD CONSTRAINT "TripExperience_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripExperience" ADD CONSTRAINT "TripExperience_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
