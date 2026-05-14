import prisma from "../db/prisma";
import type { Prisma } from "../generated/prisma/client";
import { deleteMediaObjectsByStorageKeys } from "./imageService";

type ReviewInput = {
  comment?: string;
  reviewText?: string;
  rating: number;
};

function resolveReviewText(data: ReviewInput): string {
  return data.comment ?? data.reviewText ?? "";
}

function resolveRating(data: ReviewInput): number {
  const parsedRating = Number(data.rating);

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new Error("rating must be an integer from 1 to 5");
  }

  return parsedRating;
}

async function recalculateExperienceAvgRating(
  tx: Prisma.TransactionClient,
  experienceId: number,
) {
  const ratingAggregate = await tx.review.aggregate({
    where: { experienceId },
    _avg: { rating: true },
    _count: { id: true },
  });

  const avgRating =
    ratingAggregate._count.id > 0 ? ratingAggregate._avg.rating : null;

  await tx.experience.update({
    where: { id: experienceId },
    data: { avgRating: avgRating ?? null },
  });
}

export async function createReview(
  experienceId: number,
  userId: number,
  data: ReviewInput,
) {
  return prisma.$transaction(async (tx) => {
    const createdReview = await tx.review.create({
      data: {
        reviewText: resolveReviewText(data),
        rating: resolveRating(data),
        experienceId,
        userId,
      },
    });

    await recalculateExperienceAvgRating(tx, experienceId);

    return createdReview;
  });
}

export async function deleteReview(reviewId: number, userId: number) {
  const deletedReview = await prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, experienceId: true },
    });

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== userId) {
      throw new Error("Forbidden: You do not own this review");
    }

    const mediaObjects = await tx.image.findMany({
      where: { reviewId },
      select: { storageKey: true },
    });

    const deletedReviewRecord = await tx.review.delete({
      where: { id: reviewId },
    });

    await recalculateExperienceAvgRating(tx, review.experienceId);

    return {
      deletedReview: deletedReviewRecord,
      mediaStorageKeys: mediaObjects.map((item) => item.storageKey),
    };
  });

  await deleteMediaObjectsByStorageKeys(deletedReview.mediaStorageKeys);

  return deletedReview.deletedReview;
}

export async function updateReview(
  reviewId: number,
  userId: number,
  data: ReviewInput,
) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, experienceId: true },
    });

    if (!review) throw new Error("Review not found");

    if (review.userId !== userId) {
      throw new Error("Forbidden: You do not own this review");
    }

    const updatedReview = await tx.review.update({
      where: { id: reviewId },
      data: {
        reviewText: resolveReviewText(data),
        rating: resolveRating(data),
      },
    });

    await recalculateExperienceAvgRating(tx, review.experienceId);

    return updatedReview;
  });
}

type RemoveReviewMediaParams = {
  reviewId: number;
  userId: number;
  mediaIds: number[];
};

export async function removeReviewMedia({
  reviewId,
  userId,
  mediaIds,
}: RemoveReviewMediaParams) {
  if (mediaIds.length === 0) return;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.userId !== userId) {
    throw new Error("Forbidden: You do not own this review");
  }

  const mediaRows = await prisma.image.findMany({
    where: {
      id: { in: mediaIds },
      reviewId,
    },
    select: {
      id: true,
      storageKey: true,
    },
  });

  if (mediaRows.length === 0) return;

  await prisma.image.deleteMany({
    where: {
      id: { in: mediaRows.map((item) => item.id) },
      reviewId,
    },
  });

  await deleteMediaObjectsByStorageKeys(mediaRows.map((item) => item.storageKey));
}
