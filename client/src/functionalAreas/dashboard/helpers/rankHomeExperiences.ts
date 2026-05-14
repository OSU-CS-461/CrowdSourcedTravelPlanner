import type { Experience } from "../../experiences/types/types";

export const HOME_RANKING_WEIGHTS = {
  INTEREST_MATCH_WEIGHT: 1.5,
  RATING_WEIGHT: 2.2,
  REVIEW_COUNT_WEIGHT: 0.8,
  FRESHNESS_WEIGHT: 1.0,
  LOCATION_PROXIMITY_WEIGHT: 1.0,
  BAYESIAN_PRIOR_COUNT: 5,
  FALLBACK_GLOBAL_RATING: 4,
  FRESHNESS_HALF_LIFE_DAYS: 30,
  DEFAULT_LOCATION_RADIUS_KM: 8,
} as const;

export type RankHomeLocation = {
  latitude: number;
  longitude: number;
};

export type RankHomeExperiencesOptions = {
  userLocation?: RankHomeLocation | null;
  preferredRadiusKm?: number;
};

type RankableExperience = Experience & {
  id: number;
  avgRating?: number | null;
  reviewCount?: number;
  mostRecentReviewAt?: string | null;
  tags?: Array<{ id: number | string }>;
  tagIds?: number[];
  latitude?: number | null;
  longitude?: number | null;
};

function getMatchedTagCount(
  experience: RankableExperience,
  likedTagIds: Set<number>,
): number {
  if (likedTagIds.size === 0) return 0;

  const idsFromTagIds = experience.tagIds ?? [];
  const idsFromTags = (experience.tags ?? [])
    .map((tag) => Number(tag.id))
    .filter((id) => Number.isFinite(id));

  const uniqueIds = new Set<number>([...idsFromTagIds, ...idsFromTags]);
  let matched = 0;
  uniqueIds.forEach((id) => {
    if (likedTagIds.has(id)) matched += 1;
  });
  return matched;
}

function toRecentReviewTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function calculateFreshnessScore(timestamp: number | null): number {
  if (timestamp === null) return 0;

  const ageMs = Math.max(0, Date.now() - timestamp);
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const decay = Math.exp(
    (-Math.log(2) * ageDays) / HOME_RANKING_WEIGHTS.FRESHNESS_HALF_LIFE_DAYS,
  );

  return decay * HOME_RANKING_WEIGHTS.FRESHNESS_WEIGHT;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceKm(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const aLat = toRadians(latA);
  const bLat = toRadians(latB);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat) * Math.cos(bLat) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function calculateDistanceToUserKm(
  experience: RankableExperience,
  userLocation: RankHomeLocation | null,
): number | null {
  if (!userLocation) return null;

  const lat = experience.latitude;
  const lon = experience.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const distanceKm = haversineDistanceKm(
    userLocation.latitude,
    userLocation.longitude,
    lat,
    lon,
  );

  return Number.isFinite(distanceKm) ? distanceKm : null;
}

function calculateLocationProximityScore(
  distanceToUserKm: number | null,
  preferredRadiusKm: number,
): number {
  if (distanceToUserKm === null) return 0;
  if (!Number.isFinite(distanceToUserKm)) return 0;

  const radiusKm = Math.max(1, preferredRadiusKm);
  if (distanceToUserKm > radiusKm) return 0;

  const normalizedProximity = 1 - distanceToUserKm / radiusKm;
  return normalizedProximity * HOME_RANKING_WEIGHTS.LOCATION_PROXIMITY_WEIGHT;
}

function calculateBayesianRating(
  avgRating: number,
  reviewCount: number,
  globalRatingMean: number,
): number {
  const { BAYESIAN_PRIOR_COUNT } = HOME_RANKING_WEIGHTS;
  const v = Math.max(0, reviewCount);
  const m = BAYESIAN_PRIOR_COUNT;
  const c = globalRatingMean;

  return (v / (v + m)) * avgRating + (m / (v + m)) * c;
}

function calculateExperienceScore(
  experience: RankableExperience,
  likedTagIds: Set<number>,
  globalRatingMean: number,
  userLocation: RankHomeLocation | null,
  preferredRadiusKm: number,
): number {
  const matchCount = getMatchedTagCount(experience, likedTagIds);
  const rating =
    typeof experience.avgRating === "number" && Number.isFinite(experience.avgRating)
      ? experience.avgRating
      : globalRatingMean;
  const reviewCount = Math.max(0, experience.reviewCount ?? 0);
  const bayesianRating = calculateBayesianRating(rating, reviewCount, globalRatingMean);
  const freshnessScore = calculateFreshnessScore(
    toRecentReviewTimestamp(experience.mostRecentReviewAt),
  );
  const distanceToUserKm = calculateDistanceToUserKm(experience, userLocation);
  const locationProximityScore = calculateLocationProximityScore(
    distanceToUserKm,
    preferredRadiusKm,
  );

  return (
    matchCount * HOME_RANKING_WEIGHTS.INTEREST_MATCH_WEIGHT +
    bayesianRating * HOME_RANKING_WEIGHTS.RATING_WEIGHT +
    Math.log1p(reviewCount) * HOME_RANKING_WEIGHTS.REVIEW_COUNT_WEIGHT +
    freshnessScore +
    locationProximityScore
  );
}

export function rankHomeExperiences(
  experiences: RankableExperience[],
  likedTagIds: number[],
  options: RankHomeExperiencesOptions = {},
): RankableExperience[] {
  const likedSet = new Set(likedTagIds);
  const userLocation =
    options.userLocation &&
    Number.isFinite(options.userLocation.latitude) &&
    Number.isFinite(options.userLocation.longitude)
      ? options.userLocation
      : null;
  const preferredRadiusKm =
    options.preferredRadiusKm ?? HOME_RANKING_WEIGHTS.DEFAULT_LOCATION_RADIUS_KM;
  const hasUserLocation = userLocation !== null;

  const validRatings = experiences
    .filter(
      (exp) =>
        typeof exp.avgRating === "number" &&
        Number.isFinite(exp.avgRating) &&
        (exp.reviewCount ?? 0) > 0,
    )
    .map((exp) => exp.avgRating as number);

  const globalRatingMean =
    validRatings.length > 0
      ? validRatings.reduce((sum, value) => sum + value, 0) / validRatings.length
      : HOME_RANKING_WEIGHTS.FALLBACK_GLOBAL_RATING;

  return experiences
    .map((experience) => {
      const timestamp = toRecentReviewTimestamp(experience.mostRecentReviewAt);
      const distanceToUserKm = calculateDistanceToUserKm(experience, userLocation);
      return {
        experience,
        score: calculateExperienceScore(
          experience,
          likedSet,
          globalRatingMean,
          userLocation,
          preferredRadiusKm,
        ),
        recentReviewTimestamp: timestamp ?? 0,
        distanceToUserKm,
        avgRating: experience.avgRating ?? 0,
        reviewCount: experience.reviewCount ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (hasUserLocation) {
        const distanceA = a.distanceToUserKm ?? Number.POSITIVE_INFINITY;
        const distanceB = b.distanceToUserKm ?? Number.POSITIVE_INFINITY;
        if (distanceA !== distanceB) return distanceA - distanceB;
      }
      if (b.recentReviewTimestamp !== a.recentReviewTimestamp) {
        return b.recentReviewTimestamp - a.recentReviewTimestamp;
      }
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return b.experience.id - a.experience.id;
    })
    .map((row) => row.experience);
}
