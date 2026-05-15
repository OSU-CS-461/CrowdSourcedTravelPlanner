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
  dateCreated: Date;
};
type NewReviewData = Omit<StoredReview, "id" | "dateCreated">;

function buildTransactionStore() {
  const reviews: StoredReview[] = [];
  const statsByExperience = new Map<
    number,
    { avgRating: number | null; reviewCount: number; mostRecentReviewAt: Date | null }
  >();
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
          dateCreated: new Date(`2026-05-${String(nextReviewId).padStart(2, "0")}T12:00:00.000Z`),
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

        const maxDateCreated =
          count === 0
            ? null
            : new Date(
                scopedReviews
                  .map((review) => review.dateCreated.getTime())
                  .reduce((max, value) => Math.max(max, value), -Infinity),
              );

        return {
          _count: { id: count },
          _avg: { rating: avgRating },
          _max: {
            dateCreated: maxDateCreated,
          },
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
          data: {
            avgRating: number | null;
            reviewCount: number;
            mostRecentReviewAt: Date | null;
          };
        }) => {
          statsByExperience.set(where.id, {
            avgRating: data.avgRating,
            reviewCount: data.reviewCount,
            mostRecentReviewAt: data.mostRecentReviewAt,
          });
          return {
            id: where.id,
            avgRating: data.avgRating,
            reviewCount: data.reviewCount,
            mostRecentReviewAt: data.mostRecentReviewAt,
          };
        },
      ),
    },
  };

  return {
    tx,
    statsByExperience,
  };
}

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("reviewService avgRating synchronization", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  it("keeps avgRating correct across review create/update/delete lifecycle", async () => {
    const { tx, statsByExperience } = buildTransactionStore();

    (prismaMock.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback: (transactionClient: unknown) => Promise<unknown>) =>
        callback(tx),
    );

    const firstReview = await createReview(77, 11, {
      rating: 5,
      comment: "great",
    });
    expect(statsByExperience.get(77)).toMatchObject({
      avgRating: 5,
      reviewCount: 1,
      mostRecentReviewAt: new Date("2026-05-01T12:00:00.000Z"),
    });

    const secondReview = await createReview(77, 22, {
      rating: 3,
      comment: "ok",
    });
    expect(statsByExperience.get(77)).toMatchObject({
      avgRating: 4,
      reviewCount: 2,
      mostRecentReviewAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    await updateReview(secondReview.id, 22, {
      rating: 1,
      comment: "worse than expected",
    });
    expect(statsByExperience.get(77)).toMatchObject({
      avgRating: 3,
      reviewCount: 2,
      mostRecentReviewAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    await deleteReview(firstReview.id, 11);
    expect(statsByExperience.get(77)).toMatchObject({
      avgRating: 1,
      reviewCount: 1,
      mostRecentReviewAt: new Date("2026-05-02T12:00:00.000Z"),
    });

    await deleteReview(secondReview.id, 22);
    expect(statsByExperience.get(77)).toMatchObject({
      avgRating: null,
      reviewCount: 0,
      mostRecentReviewAt: null,
    });

    const avgUpdates = (
      tx.experience.update as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.map((call) => ({
      avgRating: call[0].data.avgRating,
      reviewCount: call[0].data.reviewCount,
      mostRecentReviewAt: call[0].data.mostRecentReviewAt,
    }));

    expect(avgUpdates).toMatchObject([
      { avgRating: 5, reviewCount: 1 },
      { avgRating: 4, reviewCount: 2 },
      { avgRating: 3, reviewCount: 2 },
      { avgRating: 1, reviewCount: 1 },
      { avgRating: null, reviewCount: 0, mostRecentReviewAt: null },
    ]);
    expect(tx.review.aggregate).toHaveBeenCalledTimes(5);
  });

  it("scopes avg recalculation to the target experience only", async () => {
    const { tx, statsByExperience } = buildTransactionStore();

    (prismaMock.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (callback: (transactionClient: unknown) => Promise<unknown>) =>
        callback(tx),
    );

    await createReview(10, 1, { rating: 5, comment: "exp 10" });
    await createReview(99, 2, { rating: 2, comment: "exp 99" });
    await createReview(10, 3, { rating: 3, comment: "exp 10 again" });

    expect(statsByExperience.get(10)?.avgRating).toBe(4);
    expect(statsByExperience.get(99)?.avgRating).toBe(2);
    expect(statsByExperience.get(10)?.reviewCount).toBe(2);
    expect(statsByExperience.get(99)?.reviewCount).toBe(1);
  });
});
