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
import { createExperience } from "../../services/experienceService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("experienceService.createExperience rollback", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  it("cleans up uploaded image metadata/objects and experience row, then throws original error", async () => {
    const originalError = new Error("final fetch failed");

    const tx = {
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
      .mockImplementation(async (callback: any) => callback(tx));

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
