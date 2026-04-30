import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../../generated/prisma/client";

vi.mock("../../db/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));

import prisma from "../../db/prisma";
import {
  createReview,
  deleteReview,
  updateReview,
} from "../../services/reviewService";

type StoredReview = {
  id: number;
  experienceId: number;
  userId: number;
  rating: number;
  reviewText: string;
};
type NewReviewData = Omit<StoredReview, "id">;

function buildTransactionStore() {
  const reviews: StoredReview[] = [];
  const avgByExperience = new Map<number, number | null>();
  let nextReviewId = 1;

  const tx = {
    review: {
      create: vi.fn(async ({ data }: { data: NewReviewData }) => {
        const createdReview = {
          id: nextReviewId,
          experienceId: data.experienceId,
          userId: data.userId,
          rating: data.rating,
          reviewText: data.reviewText,
        };

        nextReviewId += 1;
        reviews.push(createdReview);

        return createdReview;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => {
        const existingReview = reviews.find((review) => review.id === where.id);

        if (!existingReview) return null;

        return {
          id: existingReview.id,
          userId: existingReview.userId,
          experienceId: existingReview.experienceId,
        };
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: number };
          data: { reviewText: string; rating: number };
        }) => {
          const targetIndex = reviews.findIndex((review) => review.id === where.id);
          if (targetIndex < 0) throw new Error("Review not found");

          reviews[targetIndex] = {
            ...reviews[targetIndex],
            reviewText: data.reviewText,
            rating: data.rating,
          };

          return reviews[targetIndex];
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: number } }) => {
        const targetIndex = reviews.findIndex((review) => review.id === where.id);
        if (targetIndex < 0) throw new Error("Review not found");

        const [deletedReview] = reviews.splice(targetIndex, 1);
        return deletedReview;
      }),
      aggregate: vi.fn(async ({ where }: { where: { experienceId: number } }) => {
        const scopedReviews = reviews.filter(
          (review) => review.experienceId === where.experienceId,
        );

        const count = scopedReviews.length;
        const avgRating =
          count === 0
            ? null
            :
                scopedReviews.reduce((sum, review) => sum + review.rating, 0) /
                count;

        return {
          _count: { id: count },
          _avg: { rating: avgRating },
        };
      }),
    },
    experience: {
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: number };
          data: { avgRating: number | null };
        }) => {
          avgByExperience.set(where.id, data.avgRating);
          return { id: where.id, avgRating: data.avgRating };
        },
      ),
    },
  };

  return {
    tx,
    avgByExperience,
  };
}

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("reviewService avgRating synchronization", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  it("keeps avgRating correct across review create/update/delete lifecycle", async () => {
    const { tx, avgByExperience } = buildTransactionStore();

    (prismaMock.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback: (transactionClient: unknown) => Promise<unknown>) =>
        callback(tx),
    );

    const firstReview = await createReview(77, 11, {
      rating: 5,
      comment: "great",
    });
    expect(avgByExperience.get(77)).toBe(5);

    const secondReview = await createReview(77, 22, {
      rating: 3,
      comment: "ok",
    });
    expect(avgByExperience.get(77)).toBe(4);

    await updateReview(secondReview.id, 22, {
      rating: 1,
      comment: "worse than expected",
    });
    expect(avgByExperience.get(77)).toBe(3);

    await deleteReview(firstReview.id, 11);
    expect(avgByExperience.get(77)).toBe(1);

    await deleteReview(secondReview.id, 22);
    expect(avgByExperience.get(77)).toBeNull();

    const avgUpdates = (
      tx.experience.update as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.map((call) => call[0].data.avgRating);

    expect(avgUpdates).toEqual([5, 4, 3, 1, null]);
    expect(tx.review.aggregate).toHaveBeenCalledTimes(5);
  });

  it("scopes avg recalculation to the target experience only", async () => {
    const { tx, avgByExperience } = buildTransactionStore();

    (prismaMock.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback: (transactionClient: unknown) => Promise<unknown>) =>
        callback(tx),
    );

    await createReview(10, 1, { rating: 5, comment: "exp 10" });
    await createReview(99, 2, { rating: 2, comment: "exp 99" });
    await createReview(10, 3, { rating: 3, comment: "exp 10 again" });

    expect(avgByExperience.get(10)).toBe(4);
    expect(avgByExperience.get(99)).toBe(2);
  });
});
