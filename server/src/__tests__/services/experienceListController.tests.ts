import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const { listExperiencesMock } = vi.hoisted(() => ({
  listExperiencesMock: vi.fn(),
}));

vi.mock("../../services/experienceService", () => {
  return {
    listExperiences: listExperiencesMock,
  };
});

import { listExperiences } from "../../controllers/experienceController";

function makeRes() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  return { status, json } as unknown as Response;
}

describe("experienceController.listExperiences sort + filter behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listExperiencesMock.mockResolvedValue([]);
  });

  it("supports sortBy=mostRecentReviewAt", async () => {
    const req = {
      query: {
        sortBy: "mostRecentReviewAt",
        sortDirection: "desc",
        limit: "10",
      },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await listExperiences(req, res, next);

    expect(listExperiencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { mostRecentReviewAt: "desc" },
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("supports sortBy=reviewCount", async () => {
    const req = {
      query: {
        sortBy: "reviewCount",
        sortDirection: "desc",
      },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await listExperiences(req, res, next);

    expect(listExperiencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { reviewCount: "desc" },
      }),
    );
  });

  it("applies reviewedOnly to prefer reviewed experiences", async () => {
    const req = {
      query: {
        reviewedOnly: "true",
      },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await listExperiences(req, res, next);

    expect(listExperiencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reviewCount: { gt: 0 },
          mostRecentReviewAt: { not: null },
        }),
      }),
    );
  });

  it("keeps Explore tag + bounds filters behavior", async () => {
    const req = {
      query: {
        tags: "hiking,beach",
        tagMode: "or",
        minLat: "44.7",
        maxLat: "45.1",
        minLng: "-123",
        maxLng: "-122.5",
      },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await listExperiences(req, res, next);

    expect(listExperiencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          experienceTags: {
            some: {
              tag: {
                slug: {
                  in: ["hiking", "beach"],
                },
              },
            },
          },
          latitude: { gte: 44.7, lte: 45.1 },
          longitude: { gte: -123, lte: -122.5 },
        }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
