import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import {
  apiClient,
  setAuthToken,
  getMyLikedExperiences,
  getMyLikedTags,
  getMyLikedTrips,
  likeExperience,
  unlikeExperience,
  likeTrip,
  unlikeTrip,
} from "../../../shared/services/api.service";
import { rankHomeExperiences } from "../helpers/rankHomeExperiences";
import { getCurrentCoords } from "../../experiences/helpers/ExplorePageHelpers";
import "./HomePage.css";

function formatApiError(
  responseError: unknown,
  err: unknown,
  fallback: string
): string {
  if (typeof responseError === "string" && responseError.trim()) {
    if (/invalid signature|jwt expired|unauthorized/i.test(responseError)) {
      return "Session expired or invalid — please log out and sign in again.";
    }
    return responseError;
  }
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: unknown }).message);
    if (/401|invalid signature|jwt expired/i.test(m)) {
      return "Session expired or invalid — please log out and sign in again.";
    }
  }
  return fallback;
}

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  createdByUsername?: string | null;
  thumbnail?: string;
  imageUrl?: string;
  image?: string;
  photoUrl?: string;
  coverImage?: string;
  photos?: Array<string | { url?: string | null }>;
  images?: Array<string | { url?: string | null }>;
  country?: string;
  city?: string;
  adminRegion?: string;
  avgRating?: number | null;
  reviewCount?: number;
  mostRecentReviewAt?: string | null;
  tags?: Array<{
    id: number;
    slug: string;
    label: string;
    categoryId?: number | null;
  }>;
  tagIds?: number[];
  category?: {
    id: number;
    slug: string;
    label: string;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Trip = {
  id: number;
  title: string;
  description?: string;
  dateCreated: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type FeaturedCandidate = {
  experience: Experience;
  feedIndex: number;
  rating: number | null;
  reviewCount: number;
  distanceKm: number | null;
};

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23eef2f7'/><stop offset='100%' stop-color='%23d8dee8'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><rect x='450' y='285' width='300' height='190' rx='20' fill='%23c7d0dc'/><circle cx='530' cy='350' r='26' fill='%23b2bcc9'/><path d='M470 445l90-84 74 60 50-40 66 64z' fill='%23a7b2c0'/><text x='600' y='540' text-anchor='middle' font-family='Arial,sans-serif' font-size='44' fill='%23738091'>No Image</text></svg>";

const COUNTRY_TO_REGION: Record<string, string> = {
  US: "north-america",
  CA: "north-america",
  MX: "north-america",
  BR: "south-america",
  AR: "south-america",
  CL: "south-america",
  CO: "south-america",
  PE: "south-america",
  GB: "europe",
  IE: "europe",
  FR: "europe",
  DE: "europe",
  ES: "europe",
  IT: "europe",
  PT: "europe",
  NL: "europe",
  BE: "europe",
  CH: "europe",
  AT: "europe",
  NO: "europe",
  SE: "europe",
  DK: "europe",
  FI: "europe",
  PL: "europe",
  CZ: "europe",
  JP: "asia",
  KR: "asia",
  CN: "asia",
  TW: "asia",
  HK: "asia",
  SG: "asia",
  TH: "asia",
  VN: "asia",
  ID: "asia",
  MY: "asia",
  PH: "asia",
  IN: "asia",
  AE: "asia",
  SA: "asia",
  AU: "oceania",
  NZ: "oceania",
  ZA: "africa",
  EG: "africa",
  MA: "africa",
};

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function getRegionFromCountryCode(countryCode: string | null): string | null {
  if (!countryCode) return null;
  return COUNTRY_TO_REGION[countryCode] ?? null;
}

function getUserCountryHint(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = window.localStorage.getItem("cstp.auth.user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as Record<string, unknown>;
      const directCountry =
        normalizeCountryCode(parsed.country) ??
        normalizeCountryCode(parsed.countryCode);
      if (directCountry) return directCountry;

      if (parsed.location && typeof parsed.location === "object") {
        const location = parsed.location as Record<string, unknown>;
        const nestedCountry =
          normalizeCountryCode(location.country) ??
          normalizeCountryCode(location.countryCode);
        if (nestedCountry) return nestedCountry;
      }
    }
  } catch {
    // Ignore malformed local auth user payload.
  }

  const languageHints = [
    ...(typeof navigator !== "undefined" ? navigator.languages ?? [] : []),
    typeof navigator !== "undefined" ? navigator.language : "",
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  for (const hint of languageHints) {
    const match = hint.match(/[-_]([A-Za-z]{2})$/);
    if (!match) continue;
    const country = normalizeCountryCode(match[1]);
    if (country) return country;
  }

  return null;
}

function toDisplayDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function toLocationLabel(experience: Experience): string {
  const parts = [experience.city, experience.adminRegion, experience.country]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Global";
}

function toDescriptionPreview(
  description: string | undefined,
  maxLength = 145,
): string {
  const trimmed = (description ?? "").trim();
  if (!trimmed) return "Discover more about this community-curated adventure.";
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function toNumericRating(experience: Experience): number | null {
  const value = experience.avgRating;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function toRatingBadge(experience: Experience): string | null {
  const rating = toNumericRating(experience);
  if (rating === null) return null;
  const reviewCount = Math.max(0, experience.reviewCount ?? 0);
  return reviewCount > 0
    ? `★ ${rating.toFixed(1)} (${reviewCount})`
    : `★ ${rating.toFixed(1)}`;
}

function toCategoryLabel(experience: Experience): string | null {
  const category = experience.category?.label?.trim();
  if (category) return category;
  const firstTag = experience.tags?.[0]?.label?.trim();
  return firstTag || null;
}

function resolveFromImageArray(
  value: Experience["photos"] | Experience["images"],
): string | null {
  if (!Array.isArray(value)) return null;

  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      return item;
    }
    if (item && typeof item === "object" && "url" in item) {
      const url = item.url;
      if (typeof url === "string" && url.trim()) {
        return url;
      }
    }
  }

  return null;
}

function getExperienceImage(experience: Experience): string {
  const candidates = [
    experience.thumbnail,
    experience.imageUrl,
    experience.image,
    experience.photoUrl,
    experience.coverImage,
    resolveFromImageArray(experience.photos),
    resolveFromImageArray(experience.images),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return NO_IMAGE_PLACEHOLDER;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(
  from: Coordinates,
  to: Coordinates,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const latA = toRadians(from.latitude);
  const latB = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function getDistanceToUserKm(
  experience: Experience,
  userLocation: Coordinates | null,
): number | null {
  if (!userLocation) return null;

  if (
    typeof experience.latitude !== "number" ||
    typeof experience.longitude !== "number" ||
    !Number.isFinite(experience.latitude) ||
    !Number.isFinite(experience.longitude)
  ) {
    return null;
  }

  return haversineDistanceKm(userLocation, {
    latitude: experience.latitude,
    longitude: experience.longitude,
  });
}

function compareFeaturedCandidates(
  left: FeaturedCandidate,
  right: FeaturedCandidate,
): number {
  const leftHasRating = left.rating !== null;
  const rightHasRating = right.rating !== null;
  if (leftHasRating !== rightHasRating) return leftHasRating ? -1 : 1;

  if (left.rating !== null && right.rating !== null && right.rating !== left.rating) {
    return right.rating - left.rating;
  }

  if (right.reviewCount !== left.reviewCount) {
    return right.reviewCount - left.reviewCount;
  }

  const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
  const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;
  if (leftDistance !== rightDistance) return leftDistance - rightDistance;

  return left.feedIndex - right.feedIndex;
}

function pickBestCandidate(candidates: FeaturedCandidate[]): Experience | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort(compareFeaturedCandidates);
  return sorted[0]?.experience ?? null;
}

function pickFeaturedExperience(
  experiences: Experience[],
  userLocation: Coordinates | null,
  userCountryCode: string | null,
): Experience | null {
  if (experiences.length === 0) return null;

  const candidates: FeaturedCandidate[] = experiences.map((experience, feedIndex) => ({
    experience,
    feedIndex,
    rating: toNumericRating(experience),
    reviewCount: Math.max(0, experience.reviewCount ?? 0),
    distanceKm: getDistanceToUserKm(experience, userLocation),
  }));

  if (userCountryCode) {
    const sameCountry = candidates.filter(
      (candidate) =>
        normalizeCountryCode(candidate.experience.country) === userCountryCode,
    );
    const bestSameCountry = pickBestCandidate(sameCountry);
    if (bestSameCountry) return bestSameCountry;

    const userRegion = getRegionFromCountryCode(userCountryCode);
    if (userRegion) {
      const sameRegion = candidates.filter((candidate) => {
        const expCountry = normalizeCountryCode(candidate.experience.country);
        return getRegionFromCountryCode(expCountry) === userRegion;
      });
      const bestSameRegion = pickBestCandidate(sameRegion);
      if (bestSameRegion) return bestSameRegion;
    }
  }

  const nearbyCandidates = candidates.filter(
    (candidate) => candidate.distanceKm !== null && candidate.distanceKm <= 500,
  );
  const bestNearby = pickBestCandidate(nearbyCandidates);
  if (bestNearby) return bestNearby;

  const ratedCandidates = candidates.filter((candidate) => candidate.rating !== null);
  const bestRatedOverall = pickBestCandidate(ratedCandidates);
  if (bestRatedOverall) return bestRatedOverall;

  return experiences[0] ?? null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const HOME_FEED_LIMIT = 20;
  const HOME_FEED_CANDIDATE_LIMIT = 50;
  const HOME_FEED_LOCATION_RADIUS_KM = 8;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [likedExperienceIds, setLikedExperienceIds] = useState<Set<number>>(
    () => new Set()
  );
  const [likedTripIds, setLikedTripIds] = useState<Set<number>>(() => new Set());
  const [likesLoading, setLikesLoading] = useState(true);
  const [experiencesError, setExperiencesError] = useState<string | null>(null);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [experiencesLoaded, setExperiencesLoaded] = useState(false);
  const [tripsLoaded, setTripsLoaded] = useState(false);
  const [homeLikedTagIds, setHomeLikedTagIds] = useState<number[]>([]);
  const [reviewedCandidatePool, setReviewedCandidatePool] = useState<Experience[] | null>(
    null,
  );
  const [homeUserLocation, setHomeUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const userCountryHint = useMemo(() => getUserCountryHint(), []);

  const featuredExperience = useMemo(
    () => pickFeaturedExperience(experiences, homeUserLocation, userCountryHint),
    [experiences, homeUserLocation, userCountryHint],
  );

  const loadTrips = useCallback(async () => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setTrips([]);
      setTripsError(null);
      setTripsLoaded(true);
      return;
    }
    setAuthToken(token);

    try {
      const response = await apiClient.get("/trips");
      setTrips(response.data);
      setTripsError(null);
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: unknown } } }).response?.data
          ?.error;
      setTripsError(formatApiError(msg, err, "Could not load trips."));
      setTrips([]);
    } finally {
      setTripsLoaded(true);
    }
  }, []);

  const loadHomeExperiences = useCallback(async (
    locationForRanking: { latitude: number; longitude: number } | null,
  ) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) {
      setAuthToken(token);
    }

    let likedTagIds: number[] = [];
    if (token) {
      try {
        const likedTags = await getMyLikedTags();
        likedTagIds = likedTags.map((tag) => tag.id);
      } catch (err) {
        console.error("Failed to load liked tags for home ranking:", err);
      }
    }
    setHomeLikedTagIds(likedTagIds);

    try {
      const reviewedResponse = await apiClient.get<Experience[]>("/experiences", {
        params: {
          sortBy: "mostRecentReviewAt",
          sortDirection: "desc",
          reviewedOnly: true,
          limit: HOME_FEED_CANDIDATE_LIMIT,
        },
      });

      const reviewedExperiences = reviewedResponse.data ?? [];
      const hasReviewStats = reviewedExperiences.some(
        (exp) =>
          exp.reviewCount !== undefined ||
          exp.mostRecentReviewAt !== undefined,
      );

      if (reviewedExperiences.length > 0 && hasReviewStats) {
        setReviewedCandidatePool(reviewedExperiences);
        const ranked = rankHomeExperiences(reviewedExperiences, likedTagIds, {
          userLocation: locationForRanking,
          preferredRadiusKm: HOME_FEED_LOCATION_RADIUS_KM,
        }).slice(
          0,
          HOME_FEED_LIMIT,
        );
        setExperiences(ranked);
        setExperiencesError(null);
        setExperiencesLoaded(true);
        return;
      }
    } catch (err) {
      console.error("Failed to load recently reviewed experience pool:", err);
    }

    // Safe fallback to existing home feed behavior.
    try {
      setReviewedCandidatePool(null);
      const fallbackResponse = await apiClient.get<Experience[]>("/experiences");
      setExperiences(fallbackResponse.data ?? []);
      setExperiencesError(null);
    } catch (err: unknown) {
      console.error(err);
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: unknown } } }).response?.data
          ?.error;
      setExperiencesError(formatApiError(msg, err, "Could not load experiences."));
      setExperiences([]);
    } finally {
      setExperiencesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadHomeExperiences(null);
    void loadTrips();
  }, [loadHomeExperiences, loadTrips]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { lat, lng } = await getCurrentCoords();
        if (cancelled) return;
        setHomeUserLocation({ latitude: lat, longitude: lng });
      } catch (err) {
        console.warn("Could not get user location for home feed ranking:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!reviewedCandidatePool || reviewedCandidatePool.length === 0) return;

    const ranked = rankHomeExperiences(reviewedCandidatePool, homeLikedTagIds, {
      userLocation: homeUserLocation,
      preferredRadiusKm: HOME_FEED_LOCATION_RADIUS_KM,
    }).slice(0, HOME_FEED_LIMIT);
    setExperiences(ranked);
  }, [
    homeLikedTagIds,
    homeUserLocation,
    reviewedCandidatePool,
  ]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setLikesLoading(false);
      return;
    }
    setAuthToken(token);
    let cancelled = false;
    void (async () => {
      try {
        setLikesLoading(true);
        const [likedExps, likedTripsList] = await Promise.all([
          getMyLikedExperiences(),
          getMyLikedTrips(),
        ]);
        if (cancelled) return;
        setLikedExperienceIds(new Set(likedExps.map((e) => e.id)));
        setLikedTripIds(new Set(likedTripsList.map((t) => t.id)));
      } catch (err) {
        console.error("Failed to load saved experiences/trips:", err);
      } finally {
        if (!cancelled) setLikesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExperienceLike = async (id: number) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) return;
    const wasLiked = likedExperienceIds.has(id);
    setLikedExperienceIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasLiked) await unlikeExperience(id);
      else await likeExperience(id);
    } catch (err) {
      setLikedExperienceIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      console.error(err);
    }
  };

  const toggleTripLike = async (id: number) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) return;
    const wasLiked = likedTripIds.has(id);
    setLikedTripIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasLiked) await unlikeTrip(id);
      else await likeTrip(id);
    } catch (err) {
      setLikedTripIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      console.error(err);
    }
  };

  return (
    <main className="home-dashboard">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="home-hero__eyebrow">Community Travel Discovery</p>
          <h1>Discover your next unforgettable trip</h1>
          <p>
            Explore community-built experiences, save favorites, and organize
            them into custom trips.
          </p>
          <div className="home-hero__actions">
            <button
              className="home-btn home-btn--primary"
              onClick={() => navigate(ClientRoutes.EXPERIENCE_CREATE)}
            >
              Create Experience
            </button>
            <button
              className="home-btn home-btn--accent"
              onClick={() => navigate(ClientRoutes.TRIP_CREATE)}
            >
              Create Trip
            </button>
            <button
              className="home-btn home-btn--secondary"
              onClick={() => navigate(ClientRoutes.EXPLORE)}
            >
              Explore Experiences
            </button>
          </div>
        </div>

        <article
          className="home-hero__visual"
          onClick={() => {
            if (!featuredExperience) return;
            navigate(
              ClientRoutes.EXPERIENCE_DETAILS.replace(
                ":id",
                featuredExperience.id.toString()
              ),
              { state: { experience: featuredExperience } }
            );
          }}
        >
          <img
            src={featuredExperience ? getExperienceImage(featuredExperience) : NO_IMAGE_PLACEHOLDER}
            alt={featuredExperience ? featuredExperience.title : "Featured experience placeholder"}
          />
          <div className="hero-featured-overlay">
            <p className="hero-featured-overlay__label">Featured Experience</p>
            <div className="hero-featured-overlay__badges">
              {featuredExperience && toRatingBadge(featuredExperience) ? (
                <span className="home-chip home-chip--rating">
                  {toRatingBadge(featuredExperience)}
                </span>
              ) : null}
            </div>
            <h2 className="hero-featured-overlay__title">
              {featuredExperience ? `Featured: ${featuredExperience.title}` : "No featured experience yet"}
            </h2>
            <p className="hero-featured-overlay__meta">
              {featuredExperience ? toLocationLabel(featuredExperience) : "Add experiences to populate this section."}
            </p>
            {featuredExperience ? (
              <button
                className="home-btn home-btn--primary hero-featured-overlay__cta"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(
                    ClientRoutes.EXPERIENCE_DETAILS.replace(
                      ":id",
                      featuredExperience.id.toString()
                    ),
                    { state: { experience: featuredExperience } }
                  );
                }}
              >
                View Experience
              </button>
            ) : null}
          </div>
        </article>
      </section>

      {(experiencesError || tripsError) && (
        <div className="home-api-error" role="alert">
          {experiencesError ? <p>{experiencesError}</p> : null}
          {tripsError ? <p>{tripsError}</p> : null}
          <p className="home-api-error-hint">
            If tables are missing: in <code>server</code> run{" "}
            <code>{`npm run prisma:migrate:deploy`}</code>. If you see{" "}
            <code>prepared statement s0</code>, restart Prisma dev (
            <code>npx prisma dev stop default</code> then <code>npx prisma dev</code>
            ), then run migrate again. Refresh after.
          </p>
        </div>
      )}

      <section className="home-section">
        <div className="home-section__header">
          <h2>For You</h2>
          <button
            className="home-link-btn"
            onClick={() => navigate(ClientRoutes.EXPLORE)}
          >
            Explore all
          </button>
        </div>

        {!experiencesLoaded ? (
          <p className="home-status">Loading experiences...</p>
        ) : experiencesError ? null : experiences.length === 0 ? (
          <p className="home-status">
            No experiences found. Start by creating one!
          </p>
        ) : (
          <div className="for-you-grid" data-testid="for-you-grid">
            {experiences.map((exp) => {
              const liked = likedExperienceIds.has(exp.id);
              return (
                <article
                  key={exp.id}
                  className="for-you-card"
                  onClick={() =>
                    navigate(
                      ClientRoutes.EXPERIENCE_DETAILS.replace(
                        ":id",
                        exp.id.toString()
                      ),
                      { state: { experience: exp } }
                    )
                  }
                >
                  <div className="for-you-card__image-wrap">
                    <img src={getExperienceImage(exp)} alt={exp.title} />
                    <button
                      type="button"
                      className={`dashboard-like-btn for-you-card__like${
                        liked ? " is-liked" : ""
                      }`}
                      disabled={likesLoading}
                      title={liked ? "Remove from saved" : "Save experience"}
                      aria-pressed={liked}
                      aria-label={
                        liked
                          ? "Remove experience from saved"
                          : "Save experience"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleExperienceLike(exp.id);
                      }}
                    >
                      {liked ? "♥" : "♡"}
                    </button>
                  </div>

                  <div className="for-you-card__content">
                    <div className="for-you-card__badges">
                      {toCategoryLabel(exp) ? (
                        <span className="home-chip home-chip--category">
                          {toCategoryLabel(exp)}
                        </span>
                      ) : null}
                      {toRatingBadge(exp) ? (
                        <span className="home-chip home-chip--rating">
                          {toRatingBadge(exp)}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="for-you-card__title">{exp.title}</h3>
                    <p className="for-you-card__meta">
                      {toLocationLabel(exp)}
                      {toDisplayDate(exp.dateCreated)
                        ? ` • ${toDisplayDate(exp.dateCreated)}`
                        : ""}
                    </p>
                    <p className="for-you-card__description">
                      {toDescriptionPreview(exp.description)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="home-section home-section--trips">
        <div className="home-section__header">
          <h2>Your Trips</h2>
          <button
            className="home-link-btn"
            onClick={() => navigate(ClientRoutes.MY_TRIPS)}
          >
            View My Trips
          </button>
        </div>

        {!tripsLoaded ? (
          <p className="home-status">Loading trips...</p>
        ) : tripsError ? null : trips.length === 0 ? (
          <p className="home-status">No trips found. Create one!</p>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => {
              const liked = likedTripIds.has(trip.id);
              return (
                <article
                  key={trip.id}
                  className="trip-card"
                  onClick={() =>
                    navigate(
                      ClientRoutes.TRIP_DETAILS.replace(
                        ":id",
                        trip.id.toString()
                      )
                    )
                  }
                >
                  <div className="trip-card__head">
                    <h3 className="trip-card__title">{trip.title}</h3>
                    <button
                      type="button"
                      className={`dashboard-like-btn trip-card__like${
                        liked ? " is-liked" : ""
                      }`}
                      disabled={likesLoading}
                      title={liked ? "Remove from saved" : "Save trip"}
                      aria-pressed={liked}
                      aria-label={liked ? "Remove trip from saved" : "Save trip"}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleTripLike(trip.id);
                      }}
                    >
                      {liked ? "♥" : "♡"}
                    </button>
                  </div>

                  <p className="trip-card__meta">
                    {toDisplayDate(trip.dateCreated) ?? "Date unavailable"}
                  </p>
                  <p className="trip-card__description">
                    {toDescriptionPreview(trip.description, 120)}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
