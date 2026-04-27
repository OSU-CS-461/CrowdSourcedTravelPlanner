import prisma from "../db/prisma";
import type { Prisma } from "../generated/prisma/client";

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
  return prisma.$transaction(async (tx) => {
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

    const deletedReview = await tx.review.delete({
      where: { id: reviewId },
    });

    await recalculateExperienceAvgRating(tx, review.experienceId);

    return deletedReview;
  });
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
