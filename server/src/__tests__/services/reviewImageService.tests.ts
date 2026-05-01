import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../../generated/prisma/client";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const { r2SendMock, buildReviewImageKeyMock } = vi.hoisted(() => ({
  r2SendMock: vi.fn(),
  buildReviewImageKeyMock: vi.fn(),
}));

vi.mock("../../db/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));

vi.mock("../../lib/r2", () => ({
  r2: {
    send: r2SendMock,
  },
}));

vi.mock("../../lib/imageKeys", () => ({
  buildReviewImageKey: buildReviewImageKeyMock,
  buildExperienceImageKey: vi.fn(),
}));

import prisma from "../../db/prisma";
import { uploadReviewImages } from "../../services/imageService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("imageService.uploadReviewImages", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
    process.env.R2_ENDPOINT = "https://example-r2.dev";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET = "test-bucket";
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com/";
  });

  it("persists image rows linked to both reviewId and experienceId", async () => {
    buildReviewImageKeyMock
      .mockReturnValueOnce("experiences/44/reviews/88/img-1-photo-1.jpg")
      .mockReturnValueOnce("experiences/44/reviews/88/img-2-photo-2.jpg");

    (
      prismaMock.image.create as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: 301,
      storageKey: "experiences/44/reviews/88/img-1-photo-1.jpg",
      url: "https://cdn.example.com/experiences/44/reviews/88/img-1-photo-1.jpg",
    });
    (
      prismaMock.image.create as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: 302,
      storageKey: "experiences/44/reviews/88/img-2-photo-2.jpg",
      url: "https://cdn.example.com/experiences/44/reviews/88/img-2-photo-2.jpg",
    });

    const files: Express.Multer.File[] = [
      {
        originalname: "photo-1.jpg",
        mimetype: "image/jpeg",
        size: 11,
        buffer: Buffer.from("image-bytes-1"),
      } as Express.Multer.File,
      {
        originalname: "photo-2.jpg",
        mimetype: "image/jpeg",
        size: 12,
        buffer: Buffer.from("image-bytes-2"),
      } as Express.Multer.File,
    ];

    const results = await uploadReviewImages({
      createdBy: 7,
      experienceId: 44,
      reviewId: 88,
      files,
    });

    expect(prismaMock.image.create).toHaveBeenNthCalledWith(1, {
      data: {
        createdBy: 7,
        experienceId: 44,
        reviewId: 88,
        storageKey: "experiences/44/reviews/88/img-1-photo-1.jpg",
        originalFilename: "photo-1.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 11,
        url: "https://cdn.example.com/experiences/44/reviews/88/img-1-photo-1.jpg",
        sortOrder: 0,
      },
    });
    expect(prismaMock.image.create).toHaveBeenNthCalledWith(2, {
      data: {
        createdBy: 7,
        experienceId: 44,
        reviewId: 88,
        storageKey: "experiences/44/reviews/88/img-2-photo-2.jpg",
        originalFilename: "photo-2.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 12,
        url: "https://cdn.example.com/experiences/44/reviews/88/img-2-photo-2.jpg",
        sortOrder: 1,
      },
    });

    expect(r2SendMock).toHaveBeenCalledTimes(2);
    expect(results).toEqual([
      {
        id: 301,
        storageKey: "experiences/44/reviews/88/img-1-photo-1.jpg",
        url: "https://cdn.example.com/experiences/44/reviews/88/img-1-photo-1.jpg",
      },
      {
        id: 302,
        storageKey: "experiences/44/reviews/88/img-2-photo-2.jpg",
        url: "https://cdn.example.com/experiences/44/reviews/88/img-2-photo-2.jpg",
      },
    ]);
  });

  it("rolls back created rows and uploaded objects when a later image create fails", async () => {
    buildReviewImageKeyMock
      .mockReturnValueOnce("experiences/44/reviews/88/img-1.jpg")
      .mockReturnValueOnce("experiences/44/reviews/88/img-2.jpg");

    (
      prismaMock.image.create as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: 701,
      storageKey: "experiences/44/reviews/88/img-1.jpg",
      url: "https://cdn.example.com/experiences/44/reviews/88/img-1.jpg",
    });
    (
      prismaMock.image.create as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error("metadata write failed"));

    const files: Express.Multer.File[] = [
      {
        originalname: "photo-1.jpg",
        mimetype: "image/jpeg",
        size: 10,
        buffer: Buffer.from("image-bytes-1"),
      } as Express.Multer.File,
      {
        originalname: "photo-2.jpg",
        mimetype: "image/jpeg",
        size: 10,
        buffer: Buffer.from("image-bytes-2"),
      } as Express.Multer.File,
    ];

    await expect(
      uploadReviewImages({
        createdBy: 7,
        experienceId: 44,
        reviewId: 88,
        files,
      }),
    ).rejects.toThrow("metadata write failed");

    expect(prismaMock.image.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [701] } },
    });

    const commands = r2SendMock.mock.calls.map((call) => call[0]);
    const putKeys = commands
      .filter((command) => command instanceof PutObjectCommand)
      .map((command) => command.input.Key);
    const deleteKeys = commands
      .filter((command) => command instanceof DeleteObjectCommand)
      .map((command) => command.input.Key);

    expect(putKeys).toEqual([
      "experiences/44/reviews/88/img-1.jpg",
      "experiences/44/reviews/88/img-2.jpg",
    ]);
    expect(deleteKeys).toEqual([
      "experiences/44/reviews/88/img-1.jpg",
      "experiences/44/reviews/88/img-2.jpg",
    ]);
  });

  it("returns a clean config error when storage credentials are invalid", async () => {
    buildReviewImageKeyMock.mockReturnValueOnce(
      "experiences/44/reviews/88/img-1-photo-1.jpg",
    );
    r2SendMock.mockRejectedValueOnce(
      new Error("Resolved credential object is not valid"),
    );

    const files: Express.Multer.File[] = [
      {
        originalname: "photo-1.jpg",
        mimetype: "image/jpeg",
        size: 11,
        buffer: Buffer.from("image-bytes-1"),
      } as Express.Multer.File,
    ];

    await expect(
      uploadReviewImages({
        createdBy: 7,
        experienceId: 44,
        reviewId: 88,
        files,
      }),
    ).rejects.toMatchObject({
      status: 500,
      message: "Image upload service is not configured correctly.",
    });
  });
});
