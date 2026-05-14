import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../../generated/prisma/client";

const { uploadExperienceImagesMock, r2SendMock } = vi.hoisted(() => ({
  uploadExperienceImagesMock: vi.fn(),
  r2SendMock: vi.fn(),
}));

vi.mock("../../db/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));

vi.mock("../../services/imageService", () => ({
  uploadExperienceImages: uploadExperienceImagesMock,
}));

vi.mock("../../lib/r2", () => ({
  r2: {
    send: r2SendMock,
  },
}));

import prisma from "../../db/prisma";
import {
  createExperience,
  getExperience,
  listExperiences,
} from "../../services/experienceService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("experienceService.createExperience rollback", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  it("cleans up uploaded image metadata/objects and experience row, then throws original error", async () => {
    const originalError = new Error("final fetch failed");

    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 9 }),
      },
      category: {
        findUnique: vi.fn().mockResolvedValue({ id: 5 }),
      },
      tag: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      experience: {
        create: vi.fn().mockResolvedValue({ id: 77 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 77 }),
      },
      experienceTag: {
        createMany: vi.fn().mockResolvedValue(undefined),
      },
    };

    (prismaMock.$transaction as unknown as ReturnType<typeof vi.fn>)
      .mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx));

    uploadExperienceImagesMock.mockResolvedValue([
      {
        id: 1001,
        storageKey: "experiences/77/images/test.png",
        url: "https://cdn.example.com/experiences/77/images/test.png",
      },
    ]);

    (prismaMock.experience.findUniqueOrThrow as unknown as ReturnType<
      typeof vi.fn
    >).mockRejectedValue(originalError);

    await expect(
      createExperience({
        userId: 9,
        postBody: {
          title: "Coastal Walk",
          description:
            "A memorable walk along the coast with dramatic cliffs and viewpoints.",
          categoryId: 5,
          country: "US",
          latitude: 44.5,
          longitude: -123.2,
          thumbnail: "https://example.com/keep-existing-thumbnail.jpg",
        },
        files: [
          {
            originalname: "test.png",
            mimetype: "image/png",
            size: 12,
            buffer: Buffer.from("img"),
          } as Express.Multer.File,
        ],
      }),
    ).rejects.toBe(originalError);

    expect(prismaMock.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1001] } },
    });
    expect(r2SendMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.experience.deleteMany).toHaveBeenCalledWith({
      where: { id: 77 },
    });
  });
});

describe("experienceService.getExperience reviewCount", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  it("returns reviewCount as 0 when an experience has no reviews", async () => {
    (prismaMock.experience.findUnique as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValue({
        id: 44,
        title: "Quiet Trail",
        description: "Scenic and quiet trail for beginner hikers.",
        avgRating: null,
        experienceTags: [],
        user: { username: "alex" },
        reviews: [],
        _count: { reviews: 0 },
      });

    const result = await getExperience({ experienceId: 44 });

    expect(result).not.toBeNull();
    expect(result?.reviewCount).toBe(0);
    expect(result?.avgRating).toBeNull();
  });

  it("returns reviewCount from Prisma _count when reviews exist", async () => {
    (prismaMock.experience.findUnique as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValue({
        id: 55,
        title: "City Food Tour",
        description: "Walking food tour through multiple local restaurants.",
        avgRating: 4.3,
        experienceTags: [],
        user: { username: "jamie" },
        reviews: [{ id: 1 }, { id: 2 }],
        _count: { reviews: 2 },
      });

    const result = await getExperience({ experienceId: 55 });

    expect(result).not.toBeNull();
    expect(result?.avgRating).toBe(4.3);
    expect(result?.reviewCount).toBe(2);
  });

  it("falls back to legacy detail select when review stat columns are unavailable", async () => {
    const missingColumnError = Object.assign(
      new Error(
        'The column `Experience.mostRecentReviewAt` does not exist in the current database.',
      ),
      {
        code: "P2022",
        meta: { column: "Experience.mostRecentReviewAt" },
      },
    );

    const findUnique = prismaMock.experience.findUnique as unknown as ReturnType<
      typeof vi.fn
    >;

    findUnique.mockRejectedValueOnce(missingColumnError).mockResolvedValueOnce({
      id: 61,
      title: "Legacy Detail",
      description: "desc",
      country: "US",
      adminRegion: "OR",
      city: "Portland",
      street: "SW Main",
      postalCode: "97204",
      latitude: 45.5,
      longitude: -122.6,
      thumbnail: null,
      avgRating: null,
      dateCreated: new Date("2026-01-01T00:00:00.000Z"),
      lastUpdated: new Date("2026-01-02T00:00:00.000Z"),
      createdBy: 5,
      user: { username: "sam" },
      categoryId: 2,
      category: { id: 2, slug: "food", label: "Food" },
      experienceTags: [],
      descriptionEdit: null,
      _count: { reviews: 0 },
      reviews: [],
      images: [],
    });

    const result = await getExperience({ experienceId: 61 });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(61);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});

describe("experienceService.listExperiences fallback when review stats columns are missing", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  it("falls back to legacy query when reviewCount/mostRecentReviewAt columns are unavailable", async () => {
    const missingColumnError = Object.assign(
      new Error(
        'The column `Experience.reviewCount` does not exist in the current database.',
      ),
      {
        code: "P2022",
        meta: { column: "Experience.reviewCount" },
      },
    );

    const findMany = prismaMock.experience.findMany as unknown as ReturnType<
      typeof vi.fn
    >;

    findMany.mockRejectedValueOnce(missingColumnError).mockResolvedValueOnce([
      {
        id: 10,
        title: "Historic Walk",
        country: "US",
        adminRegion: "OR",
        city: "Portland",
        street: "SW Main",
        postalCode: "97204",
        latitude: 45.5,
        longitude: -122.6,
        thumbnail: null,
        avgRating: 4.5,
        dateCreated: new Date("2026-01-01T00:00:00.000Z"),
        lastUpdated: new Date("2026-01-02T00:00:00.000Z"),
        createdBy: 5,
        user: { username: "sam" },
        categoryId: 2,
        category: { id: 2, slug: "food", label: "Food" },
        experienceTags: [],
      },
    ]);

    const result = await listExperiences({
      limit: 10,
      offset: 0,
      where: {
        reviewCount: { gt: 0 },
        mostRecentReviewAt: { not: null },
      },
      orderBy: { mostRecentReviewAt: "desc" },
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(10);
    expect(findMany).toHaveBeenCalledTimes(2);

    const fallbackCall = findMany.mock.calls[1]?.[0];
    expect(fallbackCall.where).toEqual({});
    expect(fallbackCall.orderBy).toEqual({ dateCreated: "desc" });
    expect(fallbackCall.select.reviewCount).toBeUndefined();
    expect(fallbackCall.select.mostRecentReviewAt).toBeUndefined();
  });

  it("retries once when Prisma connection closes during list query", async () => {
    const transientError = Object.assign(new Error("Server has closed the connection."), {
      code: "P1017",
    });

    const findMany = prismaMock.experience.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    const disconnect = prismaMock.$disconnect as unknown as ReturnType<typeof vi.fn>;

    findMany.mockRejectedValueOnce(transientError).mockResolvedValueOnce([
      {
        id: 25,
        title: "Recovered List",
        country: "US",
        adminRegion: "CA",
        city: "San Diego",
        street: "Harbor Dr",
        postalCode: "92101",
        latitude: 32.7,
        longitude: -117.2,
        thumbnail: null,
        avgRating: 4.2,
        reviewCount: 5,
        mostRecentReviewAt: new Date("2026-05-14T00:00:00.000Z"),
        dateCreated: new Date("2026-05-01T00:00:00.000Z"),
        lastUpdated: new Date("2026-05-14T00:00:00.000Z"),
        createdBy: 3,
        user: { username: "pat" },
        categoryId: 2,
        category: { id: 2, slug: "food", label: "Food" },
        experienceTags: [],
      },
    ]);
    disconnect.mockResolvedValue(undefined);

    const result = await listExperiences({
      limit: 10,
      offset: 0,
      where: {},
      orderBy: { dateCreated: "desc" },
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(25);
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
