import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authMiddleware";

const {
  requireAuthMock,
  uploadArrayMock,
  passthroughUploadMiddleware,
  createReviewMock,
  updateReviewMock,
  deleteReviewMock,
  uploadReviewImagesMock,
  prismaReviewFindManyMock,
  prismaReviewFindUniqueOrThrowMock,
} = vi.hoisted(() => {
  const passthrough = vi.fn(
    (
      _req: AuthenticatedRequest,
      _res: Response,
      next: (error?: unknown) => void,
    ) => next(),
  );

  return {
    requireAuthMock: vi.fn(),
    uploadArrayMock: vi.fn(() => passthrough),
    passthroughUploadMiddleware: passthrough,
    createReviewMock: vi.fn(),
    updateReviewMock: vi.fn(),
    deleteReviewMock: vi.fn(),
    uploadReviewImagesMock: vi.fn(),
    prismaReviewFindManyMock: vi.fn(),
    prismaReviewFindUniqueOrThrowMock: vi.fn(),
  };
});

vi.mock("../../middleware/authMiddleware", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("../../middleware/upload", () => ({
  upload: {
    array: uploadArrayMock,
  },
}));

vi.mock("../../services/reviewService", () => ({
  createReview: createReviewMock,
  updateReview: updateReviewMock,
  deleteReview: deleteReviewMock,
}));

vi.mock("../../services/imageService", () => ({
  uploadReviewImages: uploadReviewImagesMock,
}));

vi.mock("../../prismaClient", () => ({
  default: {
    review: {
      findMany: prismaReviewFindManyMock,
      findUniqueOrThrow: prismaReviewFindUniqueOrThrowMock,
    },
  },
}));

import reviewRouter from "../../routers/reviews";

type RouterPostHandler = (
  req: AuthenticatedRequest,
  res: Response,
) => Promise<void>;

type ReviewRouterLayer = {
  route?: {
    path?: string;
    methods?: {
      post?: boolean;
    };
    stack?: Array<{
      handle: RouterPostHandler;
    }>;
  };
};

function getCreateReviewHandler() {
  const postRouteLayer = (reviewRouter as unknown as { stack: ReviewRouterLayer[] }).stack.find(
    (layer) => layer?.route?.path === "/" && layer?.route?.methods?.post,
  );

  if (!postRouteLayer) {
    throw new Error("POST / route not found on review router");
  }

  const routeHandlers = postRouteLayer.route?.stack?.map((entry) => entry.handle) ?? [];
  if (routeHandlers.length === 0) {
    throw new Error("POST / route handlers not found on review router");
  }
  return routeHandlers[routeHandlers.length - 1];
}

function buildCreatedReview(
  overrides: Partial<{
    id: number;
    experienceId: number;
    userId: number;
    rating: number;
    reviewText: string;
    images: Array<{ id: number; url: string; altText: string | null }>;
  }> = {},
) {
  return {
    id: overrides.id ?? 1001,
    experienceId: overrides.experienceId ?? 77,
    userId: overrides.userId ?? 42,
    rating: overrides.rating ?? 5,
    reviewText: overrides.reviewText ?? "Excellent place.",
    dateCreated: new Date("2026-04-22T10:00:00.000Z"),
    user: { username: "traveler" },
    images: overrides.images ?? [],
  };
}

function buildMockResponse() {
  let statusCode = 200;
  let jsonBody: unknown = undefined;

  const res = {
    status: vi.fn().mockImplementation((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((body: unknown) => {
      jsonBody = body;
      return res;
    }),
  } as unknown as Response;

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
  };
}

describe("reviews router create multipart path", () => {
  const createReviewHandler = getCreateReviewHandler();

  beforeEach(() => {
    requireAuthMock.mockReset();
    createReviewMock.mockReset();
    updateReviewMock.mockReset();
    deleteReviewMock.mockReset();
    uploadReviewImagesMock.mockReset();
    prismaReviewFindManyMock.mockReset();
    prismaReviewFindUniqueOrThrowMock.mockReset();
    uploadArrayMock.mockImplementation(() => passthroughUploadMiddleware);
    prismaReviewFindManyMock.mockResolvedValue([]);
  });

  it("registers multer middleware with expected images field and limit", () => {
    expect(uploadArrayMock).toHaveBeenCalledWith("images", 10);
  });

  it("creates a text-only review (no files) from multipart-form string fields", async () => {
    createReviewMock.mockResolvedValue({ id: 501 });
    prismaReviewFindUniqueOrThrowMock.mockResolvedValue(
      buildCreatedReview({
        id: 501,
        reviewText: "Great trail and views.",
      }),
    );

    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "77",
        rating: "5",
        comment: "Great trail and views.",
      },
      files: [],
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(201);
    expect(createReviewMock).toHaveBeenCalledWith(77, 42, {
      comment: "Great trail and views.",
      rating: 5,
    });
    expect(uploadReviewImagesMock).not.toHaveBeenCalled();
    expect(getJsonBody()).toMatchObject({
      id: "501",
      experienceId: "77",
      userId: "42",
      rating: 5,
      comment: "Great trail and views.",
      media: [],
    });
  });

  it("creates a review with one image and returns one media item", async () => {
    createReviewMock.mockResolvedValue({ id: 601 });
    uploadReviewImagesMock.mockResolvedValue([
      {
        id: 9001,
        storageKey: "experiences/77/reviews/601/photo-1.png",
        url: "https://cdn.example.com/experiences/77/reviews/601/photo-1.png",
      },
    ]);
    prismaReviewFindUniqueOrThrowMock.mockResolvedValue(
      buildCreatedReview({
        id: 601,
        images: [
          {
            id: 9001,
            url: "https://cdn.example.com/experiences/77/reviews/601/photo-1.png",
            altText: null,
          },
        ],
      }),
    );

    const files = [
      {
        fieldname: "images",
        originalname: "photo-1.png",
        mimetype: "image/png",
        size: 120,
        buffer: Buffer.from("image-1"),
      } as Express.Multer.File,
    ];

    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "77",
        rating: "4",
        comment: "Nice stop with good food.",
      },
      files,
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(201);
    expect(uploadReviewImagesMock).toHaveBeenCalledWith({
      createdBy: 42,
      experienceId: 77,
      reviewId: 601,
      files,
    });
    expect(getJsonBody()).toMatchObject({
      id: "601",
      media: [
        {
          id: "9001",
          url: "https://cdn.example.com/experiences/77/reviews/601/photo-1.png",
          type: "image",
          alt: "",
        },
      ],
    });
  });

  it("creates a review with multiple images and preserves response media order", async () => {
    createReviewMock.mockResolvedValue({ id: 602 });
    uploadReviewImagesMock.mockResolvedValue([
      {
        id: 9101,
        storageKey: "experiences/77/reviews/602/photo-1.jpg",
        url: "https://cdn.example.com/experiences/77/reviews/602/photo-1.jpg",
      },
      {
        id: 9102,
        storageKey: "experiences/77/reviews/602/photo-2.jpg",
        url: "https://cdn.example.com/experiences/77/reviews/602/photo-2.jpg",
      },
    ]);
    prismaReviewFindUniqueOrThrowMock.mockResolvedValue(
      buildCreatedReview({
        id: 602,
        images: [
          {
            id: 9101,
            url: "https://cdn.example.com/experiences/77/reviews/602/photo-1.jpg",
            altText: null,
          },
          {
            id: 9102,
            url: "https://cdn.example.com/experiences/77/reviews/602/photo-2.jpg",
            altText: "second photo",
          },
        ],
      }),
    );

    const files = [
      {
        fieldname: "images",
        originalname: "photo-1.jpg",
        mimetype: "image/jpeg",
        size: 99,
        buffer: Buffer.from("image-1"),
      } as Express.Multer.File,
      {
        fieldname: "images",
        originalname: "photo-2.jpg",
        mimetype: "image/jpeg",
        size: 100,
        buffer: Buffer.from("image-2"),
      } as Express.Multer.File,
    ];

    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "77",
        rating: "5",
        comment: "Fantastic market and guides.",
      },
      files,
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(201);
    expect(uploadReviewImagesMock).toHaveBeenCalledWith({
      createdBy: 42,
      experienceId: 77,
      reviewId: 602,
      files,
    });
    expect((getJsonBody() as { media: Array<{ id: string }> }).media).toEqual([
      { id: "9101", url: "https://cdn.example.com/experiences/77/reviews/602/photo-1.jpg", type: "image", alt: "" },
      { id: "9102", url: "https://cdn.example.com/experiences/77/reviews/602/photo-2.jpg", type: "image", alt: "second photo" },
    ]);
  });

  it("rejects invalid rating", async () => {
    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "77",
        rating: "8",
        comment: "Should fail",
      },
      files: [],
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(400);
    expect(getJsonBody()).toEqual({
      error: "rating must be an integer from 1 to 5",
    });
    expect(createReviewMock).not.toHaveBeenCalled();
    expect(uploadReviewImagesMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched experienceId between route and body", async () => {
    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "88",
        rating: "5",
        comment: "Should fail",
      },
      files: [],
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(400);
    expect(getJsonBody()).toEqual({
      error: "Body experienceId does not match route experience ID",
    });
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it("rejects non-numeric body experienceId when provided", async () => {
    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "not-a-number",
        rating: "5",
        comment: "Should fail",
      },
      files: [],
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(400);
    expect(getJsonBody()).toEqual({
      error: "Invalid experienceId field",
    });
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it("rejects unauthorized request when user is missing", async () => {
    const req = {
      params: { id: "77" },
      body: {
        experienceId: "77",
        rating: "5",
        comment: "No auth user",
      },
      files: [],
    } as unknown as AuthenticatedRequest;
    const { res, getStatusCode, getJsonBody } = buildMockResponse();

    await createReviewHandler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getJsonBody()).toEqual({ error: "Unauthorized" });
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it("does not upload images when review creation fails and rolls back when image upload fails", async () => {
    const req = {
      params: { id: "77" },
      user: { id: 42 },
      body: {
        experienceId: "77",
        rating: "5",
        comment: "failure path",
      },
      files: [
        {
          fieldname: "images",
          originalname: "photo-1.jpg",
          mimetype: "image/jpeg",
          size: 50,
          buffer: Buffer.from("image-1"),
        } as Express.Multer.File,
      ],
    } as unknown as AuthenticatedRequest;

    const createFailRes = buildMockResponse();
    createReviewMock.mockRejectedValueOnce(new Error("create failed"));
    await createReviewHandler(req, createFailRes.res);

    expect(createFailRes.getStatusCode()).toBe(500);
    expect(uploadReviewImagesMock).not.toHaveBeenCalled();
    expect(deleteReviewMock).not.toHaveBeenCalled();

    const uploadFailRes = buildMockResponse();
    createReviewMock.mockResolvedValueOnce({ id: 777 });
    uploadReviewImagesMock.mockRejectedValueOnce(new Error("upload failed"));
    await createReviewHandler(req, uploadFailRes.res);

    expect(uploadFailRes.getStatusCode()).toBe(500);
    expect(deleteReviewMock).toHaveBeenCalledWith(777, 42);
  });
});
