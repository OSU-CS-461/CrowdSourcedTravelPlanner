import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const { listExperiencesMock } = vi.hoisted(() => ({
  listExperiencesMock: vi.fn(),
}));

vi.mock("../../services/experienceService", () => ({
  createExperience: vi.fn(),
  getExperience: vi.fn(),
  listExperiences: listExperiencesMock,
  updateExperience: vi.fn(),
  editExperience: vi.fn(),
  deleteExperience: vi.fn(),
}));

import { listExperiences } from "../../controllers/experienceController";

describe("experienceController tag slug filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes slug-based tag filters to service", async () => {
    listExperiencesMock.mockResolvedValue([]);

    const req = {
      query: {
        minLat: "44.7",
        maxLat: "45.1",
        minLng: "-123.0",
        maxLng: "-122.5",
        tags: "lake-lagoon,beach",
        tagMode: "or",
      },
    } as unknown as Request;
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await listExperiences(req, res, next);

    expect(listExperiencesMock).toHaveBeenCalledTimes(1);
    const args = listExperiencesMock.mock.calls[0][0];
    expect(args.where).toMatchObject({
      experienceTags: {
        some: {
          tag: {
            slug: { in: ["lake-lagoon", "beach"] },
          },
        },
      },
    });
    expect(status).toHaveBeenCalledWith(200);
  });
});
