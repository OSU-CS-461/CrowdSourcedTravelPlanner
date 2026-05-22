import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTrip,
  listMyTrips,
  updateTrip,
  editTrip,
  deleteTrip,
  addExperienceToTrip,
  removeExperienceFromTrip,
} from "../../services/tripService";

vi.mock("../../db/prisma", () => ({
  default: {
    trip: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tripExperience: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../../db/prisma";

describe("tripService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a trip with start and end dates", async () => {
    const mockTrip = {
      id: 1,
      title: "Thailand Trip",
      description: "Food and beach trip",
      createdBy: 5,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-05"),
    };

    vi.mocked(prisma.trip.create).mockResolvedValue(mockTrip as never);

    const result = await createTrip({
      title: "Thailand Trip",
      description: "Food and beach trip",
      createdBy: 5,
      startDate: "2026-06-01",
      endDate: "2026-06-05",
    });

    expect(prisma.trip.create).toHaveBeenCalled();
    expect(result).toEqual(mockTrip);
  });

  it("lists only trips created by the current user", async () => {
    const mockTrips = [
      {
        id: 1,
        title: "My Trip",
        createdBy: 5,
        experiences: [],
      },
    ];

    vi.mocked(prisma.trip.findMany).mockResolvedValue(mockTrips as never);

    const result = await listMyTrips(5);

    expect(prisma.trip.findMany).toHaveBeenCalledWith({
      where: {
        createdBy: 5,
      },
      include: {
        experiences: true,
      },
      orderBy: {
        dateCreated: "desc",
      },
    });

    expect(result).toEqual(mockTrips);
  });

  it("updates a trip when the user owns it", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: 1,
      title: "Old Trip",
      createdBy: 5,
    } as never);

    vi.mocked(prisma.trip.update).mockResolvedValue({
      id: 1,
      title: "Updated Trip",
      createdBy: 5,
    } as never);

    const result = await updateTrip({
      tripId: 1,
      userId: 5,
      putData: {
        title: "Updated Trip",
        description: "Updated description",
        startDate: "2026-07-01",
        endDate: "2026-07-05",
      },
    });

    expect(prisma.trip.update).toHaveBeenCalled();
    expect(result).toEqual({
      id: 1,
      title: "Updated Trip",
      createdBy: 5,
    });
  });

  it("returns null when updating a trip that does not exist", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue(null);

    const result = await updateTrip({
      tripId: 999,
      userId: 5,
      putData: {
        title: "Updated Trip",
      },
    });

    expect(result).toBeNull();
    expect(prisma.trip.update).not.toHaveBeenCalled();
  });

  it("throws 403 when updating another user's trip", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: 1,
      title: "Other User Trip",
      createdBy: 9,
    } as never);

    await expect(
      updateTrip({
        tripId: 1,
        userId: 5,
        putData: {
          title: "Updated Trip",
        },
      })
    ).rejects.toEqual({
      status: 403,
      message: "User does not own this trip",
    });

    expect(prisma.trip.update).not.toHaveBeenCalled();
  });

  it("edits a trip when the user owns it", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: 1,
      title: "Old Trip",
      createdBy: 5,
    } as never);

    vi.mocked(prisma.trip.update).mockResolvedValue({
      id: 1,
      title: "Patched Trip",
      createdBy: 5,
    } as never);

    const result = await editTrip({
      tripId: 1,
      userId: 5,
      patchData: {
        title: "Patched Trip",
      },
    });

    expect(prisma.trip.update).toHaveBeenCalled();
    expect(result).toEqual({
      id: 1,
      title: "Patched Trip",
      createdBy: 5,
    });
  });

  it("deletes a trip when the user owns it", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: 1,
      title: "Trip to Delete",
      createdBy: 5,
    } as never);

    vi.mocked(prisma.trip.delete).mockResolvedValue({ id: 1 } as never);

    await deleteTrip({
      tripId: 1,
      userId: 5,
    });

    expect(prisma.trip.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("throws 404 when deleting a trip that does not exist", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue(null);

    await expect(
      deleteTrip({
        tripId: 999,
        userId: 5,
      })
    ).rejects.toEqual({
      status: 404,
      message: "Trip not found",
    });

    expect(prisma.trip.delete).not.toHaveBeenCalled();
  });

  it("adds an experience to a trip when the user owns the trip", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: 1,
      createdBy: 5,
    } as never);

    vi.mocked(prisma.tripExperience.create).mockResolvedValue({
      tripId: 1,
      experienceId: 10,
    } as never);

    const result = await addExperienceToTrip(1, 10, 5);

    expect(prisma.tripExperience.create).toHaveBeenCalledWith({
      data: {
        tripId: 1,
        experienceId: 10,
      },
    });

    expect(result).toEqual({
      tripId: 1,
      experienceId: 10,
    });
  });

  it("removes an experience from a trip when the user owns the trip", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValue({
      id: 1,
      createdBy: 5,
    } as never);

    vi.mocked(prisma.tripExperience.delete).mockResolvedValue({
      tripId: 1,
      experienceId: 10,
    } as never);

    const result = await removeExperienceFromTrip(1, 10, 5);

    expect(prisma.tripExperience.delete).toHaveBeenCalledWith({
      where: {
        tripId_experienceId: {
          tripId: 1,
          experienceId: 10,
        },
      },
    });

    expect(result).toEqual({
      tripId: 1,
      experienceId: 10,
    });
  });
});