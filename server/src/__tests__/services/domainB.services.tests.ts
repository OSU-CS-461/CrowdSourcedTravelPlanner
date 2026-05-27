import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../../generated/prisma/client";

vi.mock("../../db/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));

import prisma from "../../db/prisma";
import { deleteInterest, updateInterest } from "../../services/interestService";
import { getSettingsForUser, updateSettingsForUser } from "../../services/settingsService";
import { deleteTrip, updateTrip } from "../../services/tripService";
import { addUserLikedTrip } from "../../services/userLikedTripService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const baseTrip = {
  id: 1,
  title: "My Trip",
  description: null,
  createdBy: 10,
  startDate: null,
  endDate: null,
  dateCreated: new Date(),
  lastUpdated: new Date(),
};

const baseInterest = {
  id: 1,
  name: "Hiking",
  description: null,
  createdBy: 10,
  dateCreated: new Date(),
  lastUpdated: new Date(),
};

/** Domain B unit tests: trips, interests, settings, likes (mocked Prisma) */
describe("Domain B services", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe("tripService", () => {
    it("updateTrip throws 403 for non-owner", async () => {
      (prismaMock.trip.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        baseTrip
      );
      await expect(
        updateTrip({ tripId: 1, userId: 99, putData: { title: "Stolen" } })
      ).rejects.toMatchObject({ status: 403 });
    });

    it("deleteTrip throws 404 when missing", async () => {
      (prismaMock.trip.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(deleteTrip({ tripId: 1, userId: 10 })).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe("interestService", () => {
    it("updateInterest throws 403 for non-owner", async () => {
      (prismaMock.interest.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        baseInterest
      );
      await expect(
        updateInterest({ interestId: 1, userId: 99, putData: { name: "Stolen" } })
      ).rejects.toMatchObject({ status: 403 });
    });

    it("deleteInterest throws 403 for non-owner", async () => {
      (prismaMock.interest.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        baseInterest
      );
      await expect(deleteInterest({ interestId: 1, userId: 99 })).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe("settingsService", () => {
    it("getSettingsForUser creates defaults when row missing", async () => {
      (prismaMock.userSettings.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );
      (prismaMock.userSettings.findUniqueOrThrow as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        {
          preferredFeedSort: "newest",
          themePreference: "light",
          lastUpdated: new Date(),
          user: { email: "a@test.example" },
        }
      );
      const result = await getSettingsForUser(1);
      expect(prismaMock.userSettings.create).toHaveBeenCalled();
      expect(result.preferredFeedSort).toBe("newest");
    });

    it("updateSettingsForUser upserts preferences", async () => {
      (prismaMock.userSettings.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        preferredFeedSort: "highestRated",
        themePreference: "dark",
        lastUpdated: new Date(),
      });
      (prismaMock.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "c@test.example",
      });
      const result = await updateSettingsForUser(3, { themePreference: "dark" });
      expect(result.themePreference).toBe("dark");
    });
  });

  describe("userLikedTripService", () => {
    it("addUserLikedTrip returns NOT_FOUND for missing trip", async () => {
      (prismaMock.trip.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      expect(await addUserLikedTrip(1, 99)).toEqual({ ok: false, error: "NOT_FOUND" });
    });

    it("addUserLikedTrip creates like when trip exists", async () => {
      (prismaMock.trip.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 2,
      });
      (prismaMock.userLikedTrip.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: 1,
        tripId: 2,
      });
      expect(await addUserLikedTrip(1, 2)).toEqual({ ok: true, alreadyLiked: false });
    });
  });
});
