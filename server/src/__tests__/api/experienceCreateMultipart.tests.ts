import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authMiddleware";

const { createExperienceMock } = vi.hoisted(() => ({
  createExperienceMock: vi.fn(),
}));

vi.mock("../../services/experienceService", () => ({
  createExperience: createExperienceMock,
  getExperience: vi.fn(),
  listExperiences: vi.fn(),
  updateExperience: vi.fn(),
  editExperience: vi.fn(),
  deleteExperience: vi.fn(),
}));

import { createExperience } from "../../controllers/experienceController";

describe("createExperience controller multipart path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes multipart text fields and forwards files", async () => {
    createExperienceMock.mockResolvedValue({ id: 999, title: "Created" });

    const req = {
      body: {
        title: "Sunset Hike",
        description: "A long evening hike with scenic views and local stories.",
        categoryId: "3",
        country: "us",
        adminRegion: "",
        city: "Bend",
        street: "",
        postalCode: "",
        latitude: "44.0582",
        longitude: "-121.3153",
        tagIds: ["7", "8"],
      },
      files: [
        {
          fieldname: "images",
          originalname: "sunset.png",
          mimetype: "image/png",
          size: 128,
          buffer: Buffer.from("fake image bytes"),
        } as Express.Multer.File,
      ],
      user: { id: 42 },
    } as unknown as AuthenticatedRequest;

    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await createExperience(req, res, next);

    expect(createExperienceMock).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ id: 999, title: "Created" });
    expect(next).not.toHaveBeenCalled();

    const createArg = createExperienceMock.mock.calls[0][0];
    expect(createArg.userId).toBe(42);
    expect(createArg.postBody).toMatchObject({
      title: "Sunset Hike",
      description: "A long evening hike with scenic views and local stories.",
      categoryId: 3,
      country: "US",
      city: "Bend",
      latitude: 44.0582,
      longitude: -121.3153,
      tagIds: [7, 8],
      adminRegion: undefined,
      street: undefined,
      postalCode: undefined,
    });
    expect(Array.isArray(createArg.files)).toBe(true);
    expect(createArg.files).toHaveLength(1);
    expect(createArg.files[0].fieldname).toBe("images");
  });
});
