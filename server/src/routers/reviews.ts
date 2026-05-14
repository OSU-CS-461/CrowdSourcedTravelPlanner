import { Router } from "express";
import prisma from "../prismaClient";
import * as authMiddleware from "../middleware/authMiddleware";
import * as reviewService from "../services/reviewService";
import { upload } from "../middleware/upload";
import { uploadReviewImages } from "../services/imageService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const nested = firstString(value[i]);
      if (nested !== undefined) return nested;
    }
    return undefined;
  }

  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function optionalString(value: unknown): string | undefined {
  const raw = firstString(value);
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  const raw = optionalString(value);
  if (raw === undefined) return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function numberArrayField(value: unknown): number[] {
  const rawValues = Array.isArray(value) ? value : [value];
  const parsed = rawValues
    .flatMap((entry) => {
      if (typeof entry === "string") return entry.split(",");
      if (typeof entry === "number" && Number.isFinite(entry)) return [String(entry)];
      return [];
    })
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);

  return parsed;
}

function parseReviewRating(value: unknown): number | undefined {
  const parsed = optionalNumber(value);
  if (parsed === undefined) return undefined;

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return Number.NaN;
  }

  return parsed;
}

function formatReview(review: {
  id: number;
  experienceId: number;
  userId: number;
  rating: number;
  reviewText: string;
  dateCreated: Date;
  user?: { username?: string | null } | null;
  images?: Array<{
    id: number;
    url: string;
    altText: string | null;
    mediaType?: "IMAGE" | "VIDEO" | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    originalFilename?: string | null;
  }> | null;
}) {
  return {
    id: review.id.toString(),
    experienceId: review.experienceId.toString(),
    userId: review.userId.toString(),
    userName: review.user?.username || "Anonymous",
    rating: review.rating,
    comment: review.reviewText,
    createdAt: review.dateCreated,
    media:
      review.images?.map((image) => ({
        id: image.id.toString(),
        url: image.url,
        type: image.mediaType === "VIDEO" ? ("video" as const) : ("image" as const),
        mediaType: image.mediaType ?? "IMAGE",
        mimeType: image.mimeType ?? null,
        fileSizeBytes: image.fileSizeBytes ?? null,
        originalFilename: image.originalFilename ?? null,
        alt: image.altText || "",
      })) || [],
  };
}

// --- GET (Public) ---
router.get("/", async (req, res) => {
  try {
    const experienceId = Number((req.params as { id: string }).id);

    if (!Number.isInteger(experienceId) || experienceId <= 0) {
      return res.status(400).json({ error: "Invalid experience ID" });
    }

    const reviews = await prisma.review.findMany({
      where: { experienceId },
      include: {
        user: { select: { username: true } },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            mediaType: true,
            mimeType: true,
            fileSizeBytes: true,
            originalFilename: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { dateCreated: "desc" },
    });

    const formattedReviews = reviews.map((review) => formatReview(review));

    res.json(formattedReviews);
  } catch {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// --- POST (Protected) ---
router.post(
  "/",
  authMiddleware.requireAuth,
  upload.array("images", 10),
  async (req: AuthenticatedRequest, res) => {
    let createdReviewId: number | null = null;
    let createdReviewUserId: number | null = null;

    try {
      const { id } = req.params;
      const experienceId = Number(id);
      const userId = req.user?.id;

      if (!Number.isInteger(experienceId) || experienceId <= 0) {
        return res.status(400).json({ error: "Invalid experience ID" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      createdReviewUserId = userId;

      const bodyExperienceId = optionalNumber(req.body.experienceId);
      if (bodyExperienceId !== undefined && Number.isNaN(bodyExperienceId)) {
        return res.status(400).json({ error: "Invalid experienceId field" });
      }
      if (
        bodyExperienceId !== undefined &&
        Number(bodyExperienceId) !== experienceId
      ) {
        return res
          .status(400)
          .json({ error: "Body experienceId does not match route experience ID" });
      }

      const rating = parseReviewRating(req.body.rating);
      if (rating === undefined || Number.isNaN(rating)) {
        return res.status(400).json({ error: "rating must be an integer from 1 to 5" });
      }

      const files = (req.files as Express.Multer.File[]) ?? [];
      const comment =
        optionalString(req.body.comment) ?? optionalString(req.body.text) ?? "";

      const newReview = await reviewService.createReview(experienceId, userId, {
        comment,
        rating,
      });
      createdReviewId = newReview.id;

      if (files.length > 0) {
        await uploadReviewImages({
          createdBy: userId,
          experienceId,
          reviewId: newReview.id,
          files,
        });
      }

      const createdReview = await prisma.review.findUniqueOrThrow({
        where: { id: newReview.id },
        include: {
          user: { select: { username: true } },
          images: {
            select: {
              id: true,
              url: true,
              altText: true,
              mediaType: true,
              mimeType: true,
              fileSizeBytes: true,
              originalFilename: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      res.status(201).json(formatReview(createdReview));
    } catch (error: unknown) {
      if (createdReviewId && createdReviewUserId) {
        try {
          await reviewService.deleteReview(createdReviewId, createdReviewUserId);
        } catch {
          // keep original error
        }
      }

      const appError = error as { status?: number; message?: string };
      const status = Number.isInteger(appError.status) ? Number(appError.status) : 500;
      const message =
        typeof appError.message === "string"
          ? appError.message
          : error instanceof Error
            ? error.message
            : "Database error";
      res.status(status).json({ error: message });
    }
  },
);

// --- PUT (Protected + Ownership Check) ---
router.put(
  "/:reviewId",
  authMiddleware.requireAuth,
  upload.array("images", 10),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const rating = parseReviewRating(req.body.rating);
      if (rating === undefined || Number.isNaN(rating)) {
        return res.status(400).json({ error: "rating must be an integer from 1 to 5" });
      }

      const comment =
        optionalString(req.body.comment) ?? optionalString(req.body.text) ?? "";
      const files = (req.files as Express.Multer.File[]) ?? [];
      const removeMediaIds = numberArrayField(req.body.removeMediaIds);

      const updatedReview = await reviewService.updateReview(
        Number(reviewId),
        userId,
        {
          rating,
          comment,
        },
      );

      if (removeMediaIds.length > 0) {
        await reviewService.removeReviewMedia({
          reviewId: Number(reviewId),
          userId,
          mediaIds: removeMediaIds,
        });
      }

      if (files.length > 0) {
        await uploadReviewImages({
          createdBy: userId,
          experienceId: updatedReview.experienceId,
          reviewId: updatedReview.id,
          files,
        });
      }

      const refreshedReview = await prisma.review.findUniqueOrThrow({
        where: { id: updatedReview.id },
        include: {
          user: { select: { username: true } },
          images: {
            select: {
              id: true,
              url: true,
              altText: true,
              mediaType: true,
              mimeType: true,
              fileSizeBytes: true,
              originalFilename: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      );

      res.json(formatReview(refreshedReview));
    } catch (error: unknown) {
      const appError = error as { status?: number; message?: string };
      const message =
        typeof appError.message === "string"
          ? appError.message
          : error instanceof Error
            ? error.message
            : "Unknown error";
      if (Number.isInteger(appError.status)) {
        return res.status(Number(appError.status)).json({ error: message });
      }
      const status = message.includes("Forbidden") ? 403 : 500;
      res.status(status).json({ error: message });
    }
  },
);

// --- DELETE (Protected + Ownership Check) ---
router.delete(
  "/:reviewId",
  authMiddleware.requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await reviewService.deleteReview(Number(reviewId), userId);

      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const status = message.includes("Forbidden") ? 403 : 404;
      res.status(status).json({ error: message });
    }
  },
);

export default router;
