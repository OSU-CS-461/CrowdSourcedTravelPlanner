import { describe, expect, it } from "vitest";
import { rankHomeExperiences } from "./rankHomeExperiences";
import type { Experience } from "../../experiences/types/types";

function makeExperience(partial: Partial<Experience> & { id: number }): Experience {
  return {
    title: partial.title ?? `Experience ${partial.id}`,
    description: partial.description ?? "desc",
    dateCreated: partial.dateCreated ?? "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("rankHomeExperiences", () => {
  it("boosts experiences with matching liked tags", () => {
    const experiences = [
      makeExperience({ id: 1, avgRating: 4.6, reviewCount: 20, tags: [{ id: 10, slug: "h", label: "H" }] }),
      makeExperience({ id: 2, avgRating: 4.6, reviewCount: 20, tags: [{ id: 99, slug: "x", label: "X" }] }),
    ];

    const ranked = rankHomeExperiences(experiences, [10]);
    expect(ranked[0].id).toBe(1);
  });

  it("keeps non-matching experiences visible", () => {
    const experiences = [
      makeExperience({ id: 1, tags: [{ id: 10, slug: "h", label: "H" }] }),
      makeExperience({ id: 2, tags: [{ id: 20, slug: "b", label: "B" }] }),
      makeExperience({ id: 3 }),
    ];

    const ranked = rankHomeExperiences(experiences, [10]);
    expect(ranked).toHaveLength(3);
    expect(ranked.map((exp) => exp.id).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("uses general quality/recent ranking when no liked tags exist", () => {
    const experiences = [
      makeExperience({ id: 1, avgRating: 4.9, reviewCount: 40, mostRecentReviewAt: "2026-05-10T00:00:00.000Z" }),
      makeExperience({ id: 2, avgRating: 4.2, reviewCount: 4, mostRecentReviewAt: "2026-05-01T00:00:00.000Z" }),
    ];

    const ranked = rankHomeExperiences(experiences, []);
    expect(ranked[0].id).toBe(1);
  });

  it("does not let 5.0 with one review unfairly dominate strong high-count rating", () => {
    const experiences = [
      makeExperience({ id: 1, avgRating: 5, reviewCount: 1, mostRecentReviewAt: "2026-05-10T00:00:00.000Z" }),
      makeExperience({ id: 2, avgRating: 4.8, reviewCount: 120, mostRecentReviewAt: "2026-05-08T00:00:00.000Z" }),
    ];

    const ranked = rankHomeExperiences(experiences, []);
    expect(ranked[0].id).toBe(2);
  });

  it("uses mostRecentReviewAt as freshness tie-breaker", () => {
    const experiences = [
      makeExperience({ id: 1, avgRating: 4.5, reviewCount: 10, mostRecentReviewAt: "2026-05-01T00:00:00.000Z" }),
      makeExperience({ id: 2, avgRating: 4.5, reviewCount: 10, mostRecentReviewAt: "2026-05-12T00:00:00.000Z" }),
    ];

    const ranked = rankHomeExperiences(experiences, []);
    expect(ranked[0].id).toBe(2);
  });

  it("handles missing tags and review stats safely", () => {
    const experiences = [makeExperience({ id: 1 }), makeExperience({ id: 2, tags: [] })];

    const ranked = rankHomeExperiences(experiences, [999]);
    expect(ranked).toHaveLength(2);
  });

  it("uses deterministic tie-breakers when scores are otherwise equal", () => {
    const experiences = [
      makeExperience({
        id: 1,
        avgRating: 4.2,
        reviewCount: 10,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
      }),
      makeExperience({
        id: 2,
        avgRating: 4.2,
        reviewCount: 10,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
      }),
    ];

    const ranked = rankHomeExperiences(experiences, []);
    expect(ranked.map((exp) => exp.id)).toEqual([2, 1]);
  });

  it("does not mutate the input array", () => {
    const experiences = [
      makeExperience({ id: 1, avgRating: 4.1, reviewCount: 1 }),
      makeExperience({ id: 2, avgRating: 4.9, reviewCount: 30 }),
    ];
    const originalOrder = experiences.map((exp) => exp.id);

    void rankHomeExperiences(experiences, []);

    expect(experiences.map((exp) => exp.id)).toEqual(originalOrder);
  });

  it("gives nearby experiences a location boost", () => {
    const experiences = [
      makeExperience({
        id: 1,
        avgRating: 4.3,
        reviewCount: 20,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.523,
        longitude: -122.676,
      }),
      makeExperience({
        id: 2,
        avgRating: 4.3,
        reviewCount: 20,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.8,
        longitude: -123.2,
      }),
    ];

    const ranked = rankHomeExperiences(experiences, [], {
      userLocation: { latitude: 45.523, longitude: -122.676 },
      preferredRadiusKm: 8,
    });
    expect(ranked[0].id).toBe(1);
  });

  it("keeps outside-radius experiences visible", () => {
    const experiences = [
      makeExperience({
        id: 1,
        avgRating: 4.3,
        reviewCount: 20,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.523,
        longitude: -122.676,
      }),
      makeExperience({
        id: 2,
        avgRating: 4.2,
        reviewCount: 20,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 46.9,
        longitude: -124.2,
      }),
    ];

    const ranked = rankHomeExperiences(experiences, [], {
      userLocation: { latitude: 45.523, longitude: -122.676 },
      preferredRadiusKm: 8,
    });

    expect(ranked).toHaveLength(2);
    expect(ranked.map((exp) => exp.id).sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it("uses non-location ranking when user location is unavailable", () => {
    const experiences = [
      makeExperience({
        id: 1,
        avgRating: 4.7,
        reviewCount: 50,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.1,
        longitude: -122.1,
      }),
      makeExperience({
        id: 2,
        avgRating: 4.7,
        reviewCount: 50,
        mostRecentReviewAt: "2026-05-09T00:00:00.000Z",
        latitude: 45.2,
        longitude: -122.2,
      }),
    ];

    const rankedWithoutLocation = rankHomeExperiences(experiences, []);
    const rankedWithNullLocation = rankHomeExperiences(experiences, [], {
      userLocation: null,
    });

    expect(rankedWithNullLocation.map((exp) => exp.id)).toEqual(
      rankedWithoutLocation.map((exp) => exp.id),
    );
  });

  it("does not let location completely override stronger quality signals", () => {
    const experiences = [
      makeExperience({
        id: 1,
        avgRating: 5,
        reviewCount: 1,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.523,
        longitude: -122.676,
      }),
      makeExperience({
        id: 2,
        avgRating: 4.8,
        reviewCount: 120,
        mostRecentReviewAt: "2026-05-08T00:00:00.000Z",
        latitude: 46.9,
        longitude: -124.2,
      }),
    ];

    const ranked = rankHomeExperiences(experiences, [], {
      userLocation: { latitude: 45.523, longitude: -122.676 },
      preferredRadiusKm: 8,
    });

    expect(ranked[0].id).toBe(2);
  });

  it("still applies liked-tag personalization when location scoring is enabled", () => {
    const experiences = [
      makeExperience({
        id: 1,
        avgRating: 4.6,
        reviewCount: 20,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.523,
        longitude: -122.676,
        tags: [{ id: 10, slug: "hiking", label: "Hiking" }],
      }),
      makeExperience({
        id: 2,
        avgRating: 4.6,
        reviewCount: 20,
        mostRecentReviewAt: "2026-05-10T00:00:00.000Z",
        latitude: 45.523,
        longitude: -122.676,
        tags: [{ id: 99, slug: "food", label: "Food" }],
      }),
    ];

    const ranked = rankHomeExperiences(experiences, [10], {
      userLocation: { latitude: 45.523, longitude: -122.676 },
      preferredRadiusKm: 8,
    });
    expect(ranked[0].id).toBe(1);
  });
});
