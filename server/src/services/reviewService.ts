import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function createReview(experienceId: number, userId: number, data: { comment: string, rating: number }) {
  return prisma.review.create({
    data: {
      comment: data.comment,
      rating: data.rating,
      experienceId: experienceId,
      userId: userId,
    },
  });
}

export async function deleteReview(reviewId: number, userId: number) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.userId !== userId) {
    throw new Error("Forbidden: You do not own this review");
  }

  return prisma.review.delete({
    where: { id: reviewId },
  });
}

export async function updateReview(reviewId: number, userId: number, data: { comment: string, rating: number }) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new Error("Review not found");

  if (review.userId !== userId) {
    throw new Error("Forbidden: You do not own this review");
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      comment: data.comment,
      rating: data.rating,
    },
  });
}