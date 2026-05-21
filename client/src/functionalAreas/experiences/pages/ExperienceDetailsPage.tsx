import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import {
  apiClient,
  getMyLikedExperiencesStatus,
  likeExperience,
  setAuthToken,
  unlikeExperience,
} from "../../../shared/services/api.service";
import { useAuth } from "../../auth/hooks/useAuth";
import { USER_STORAGE_KEY } from "../../auth/context/auth-context";
import ReviewsSection from "../../reviews/components/ReviewSection";
import "./ExperienceDetailPage.css";
import PhotoSection from "../components/PhotoSection";

type ReviewSortOption = "recent" | "highest" | "lowest" | "media";

type Category = {
  id: number | string;
  label: string;
  slug: string;
};

type ExperienceTag = {
  id: number | string;
  label: string;
  slug: string;
  categoryId?: number;
};

type Experience = {
  id: number | string;
  title: string;
  description: string;
  dateCreated: string;
  createdByUsername?: string | null;
  lastUpdated?: string;
  thumbnail?: string;
  country?: string;
  city?: string;
  adminRegion?: string;
  street?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  avgRating?: number | null;
  reviewCount?: number;
  createdBy?: number | string;
  categoryId?: number | null;
  category?: Category | null;
  tags?: ExperienceTag[];
  tagIds?: number[];
  images: string[];
};

type ExperiencePayload = Omit<Experience, "images"> & {
  images?: Array<string | { url?: string | null } | null> | null;
};

function normalizeImages(images: ExperiencePayload["images"]): string[] {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (typeof image === "string" && image.trim().length > 0) return image;
      if (
        image &&
        typeof image === "object" &&
        typeof image.url === "string" &&
        image.url.trim().length > 0
      ) {
        return image.url;
      }
      return null;
    })
    .filter((url): url is string => url !== null);
}

function normalizeExperience(experience: ExperiencePayload): Experience {
  return {
    ...experience,
    lastUpdated: experience.lastUpdated ?? experience.dateCreated,
    images: normalizeImages(experience.images),
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocationString(experience: Experience) {
  const parts = [
    experience.street,
    experience.city,
    experience.adminRegion,
    experience.country,
  ].filter((part) => typeof part === "string" && part.trim().length > 0);
  const postal = experience.postalCode?.trim();
  if (postal) {
    parts.push(postal);
  }
  return parts.length > 0 ? parts.join(", ") : "Location not specified";
}

export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const previewExperience = (
    location.state as { experience?: ExperiencePayload } | null
  )?.experience;
  const previewMatchesRoute =
    Boolean(previewExperience) &&
    Boolean(id) &&
    String(previewExperience?.id) === id;

  const [experience, setExperience] = useState<Experience | null>(() =>
    previewMatchesRoute && previewExperience
      ? normalizeExperience(previewExperience)
      : null,
  );
  const [loading, setLoading] = useState(!previewMatchesRoute);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<ReviewSortOption>("recent");
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeStatusLoaded, setLikeStatusLoaded] = useState(false);
  const [tripPickerOpen, setTripPickerOpen] = useState(false);
  const [tripPickerLoading, setTripPickerLoading] = useState(false);
  const [tripPickerError, setTripPickerError] = useState<string | null>(null);
  const [addingToTripId, setAddingToTripId] = useState<number | null>(null);
  const [userTrips, setUserTrips] = useState<
    Array<{
      id: number;
      title: string;
      description?: string | null;
      dateCreated: string;
      createdBy: number;
    }>
  >([]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    if (!id) {
      setError("No experience ID provided");
      setLoading(false);
      return;
    }

    if (previewMatchesRoute && previewExperience) {
      setExperience(normalizeExperience(previewExperience));
      setLoading(false);
    } else {
      setExperience(null);
      setLoading(true);
    }

    setError(null);

    apiClient
      .get(`/experiences/${id}?sort=${sortBy}`)
      .then((res) => {
        const fetchedExperience = res.data as ExperiencePayload | null;
        setExperience(
          fetchedExperience ? normalizeExperience(fetchedExperience) : null,
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!previewMatchesRoute) {
          setError("Failed to load experience");
        }
        setLoading(false);
      });
  }, [id, previewExperience, previewMatchesRoute, sortBy]);

  useEffect(() => {
    if (!id) return;
    const experienceId = Number(id);
    if (!Number.isFinite(experienceId) || experienceId <= 0) return;

    const token = localStorage.getItem("cstp.auth.token");
    if (!token) return;
    setAuthToken(token);

    let cancelled = false;
    setLikeStatusLoaded(false);
    void (async () => {
      try {
        const { liked: isLiked } =
          await getMyLikedExperiencesStatus(experienceId);
        if (!cancelled) {
          setLiked(isLiked);
          setLikeStatusLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setLikeStatusLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentUserId = useMemo(() => {
    if (user?.id !== undefined && user?.id !== null) {
      return user.id;
    }

    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: string | number };
      return parsed.id ?? null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const canManageExperience =
    currentUserId !== null &&
    experience?.createdBy !== undefined &&
    String(currentUserId) === String(experience.createdBy);

  const sortedTags = useMemo(() => {
    return [...(experience?.tags ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [experience?.tags]);
  const ratingReviewCount = experience?.reviewCount ?? 0;
  const ratingReviewLabel = ratingReviewCount === 1 ? "review" : "reviews";
  const numericExperienceId = Number(experience?.id);

  async function loadOwnedTrips() {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setTripPickerError("Please sign in to add this experience to a trip.");
      return;
    }

    setAuthToken(token);
    setTripPickerLoading(true);
    setTripPickerError(null);
    try {
      const res = await apiClient.get<
        Array<{
          id: number;
          title: string;
          description?: string | null;
          dateCreated: string;
          createdBy: number;
        }>
      >("/trips/me");
      const fetchedTrips = Array.isArray(res.data) ? res.data : [];
      const ownedTrips =
        currentUserId === null
          ? fetchedTrips
          : fetchedTrips.filter(
              (trip) => String(trip.createdBy) === String(currentUserId),
            );
      setUserTrips(ownedTrips);
    } catch (err) {
      console.error(err);
      const errorObj = err as { response?: { data?: { error?: string } } };
      setTripPickerError(
        errorObj.response?.data?.error || "Failed to load your trips.",
      );
    } finally {
      setTripPickerLoading(false);
    }
  }

  async function handleOpenTripPicker() {
    if (!isAuthenticated) {
      alert("Please sign in to add this experience to a trip.");
      navigate(ClientRoutes.LOGIN);
      return;
    }
    setTripPickerOpen(true);
    await loadOwnedTrips();
  }

  async function handleAddToTrip(tripId: number) {
    if (!Number.isFinite(numericExperienceId) || numericExperienceId <= 0) {
      alert("Could not determine the current experience id.");
      return;
    }

    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("Please sign in to add this experience to a trip.");
      navigate(ClientRoutes.LOGIN);
      return;
    }

    setAuthToken(token);
    setAddingToTripId(tripId);
    try {
      await apiClient.post(`/trips/${tripId}/experiences`, {
        experienceId: numericExperienceId,
      });
      setTripPickerOpen(false);
      alert("Experience added to trip.");
    } catch (err) {
      console.error(err);
      const errorObj = err as { response?: { data?: { error?: string } } };
      alert(errorObj.response?.data?.error || "Failed to add experience to trip.");
    } finally {
      setAddingToTripId(null);
    }
  }

  async function handleToggleLike() {
    if (!id || likeLoading) return;
    const experienceId = Number(id);
    if (!Number.isFinite(experienceId) || experienceId <= 0) return;

    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("Please sign in to save experiences.");
      return;
    }
    setAuthToken(token);
    setLikeLoading(true);
    try {
      if (liked) {
        await unlikeExperience(experienceId);
        setLiked(false);
      } else {
        await likeExperience(experienceId);
        setLiked(true);
      }
    } catch (err) {
      console.error(err);
      alert("Could not update saved experience. Try again.");
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !experience) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this experience? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/experiences/${id}`);
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      const errorObj = err as { response?: { data?: { error?: string } } };
      const errorMessage =
        errorObj.response?.data?.error || "Failed to delete experience";
      alert(`Error: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !experience) {
    return (
      <main className="experience-detail-page">
        <div className="detail-status-card">Loading experience...</div>
      </main>
    );
  }

  if (!experience) {
    return (
      <main className="experience-detail-page">
        <div className="detail-status-card">
          <p>{error || "Experience not found"}</p>
          <button onClick={() => navigate(ClientRoutes.HOME)}>Go Home</button>
        </div>
      </main>
    );
  }

  return (
    <main className="experience-detail-page">
      <div className="detail-toolbar">
        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-add-trip"
            onClick={() => void handleOpenTripPicker()}
          >
            Add to Trip
          </button>
          <button
            type="button"
            className={`toolbar-like${liked ? " is-liked" : ""}`}
            onClick={() => void handleToggleLike()}
            disabled={likeLoading || !likeStatusLoaded}
            title={liked ? "Remove from saved" : "Save experience"}
            aria-pressed={liked}
            aria-label={
              liked ? "Remove from saved experiences" : "Save experience"
            }
          >
            {liked ? "♥" : "♡"}
          </button>
          {canManageExperience && (
            <>
              <button
                className="toolbar-edit"
                onClick={() =>
                  navigate(ClientRoutes.EXPERIENCE_UPDATE.replace(":id", id!))
                }
              >
                Edit
              </button>
              <button
                className="toolbar-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      <article className="detail-card">
        <PhotoSection
          id={experience.id}
          title={experience.title}
          thumbnail={experience?.thumbnail}
          photos={experience.images}
        />

        <div className="detail-body">
          <header className="detail-title-group">
            <h1>{experience.title}</h1>

            {experience.avgRating !== null &&
              experience.avgRating !== undefined && (
                <div className="rating-chip">
                  <span>{experience.avgRating.toFixed(1)}</span>
                  <div className="star-rating">
                    {"★".repeat(Math.round(experience.avgRating))}
                  </div>
                  <a href="#reviews" className="hover-underline">
                    ({ratingReviewCount} {ratingReviewLabel})
                  </a>
                </div>
              )}
          </header>

          <p className="detail-description">{experience.description}</p>

          <section className="detail-grid">
            <div className="detail-panel">
              <h2>Location</h2>
              <p>{getLocationString(experience)}</p>
              {experience.latitude != null && experience.longitude != null && (
                <p className="detail-muted">
                  {experience.latitude}, {experience.longitude}
                </p>
              )}
            </div>

            <div className="detail-panel">
              <h2>Classification</h2>
              <p>
                <strong>Category:</strong>{" "}
                {experience.category?.label ?? "Not specified"}
              </p>
              <div className="tag-list">
                {sortedTags.length ? (
                  sortedTags.map((tag) => (
                    <Link
                      key={tag.id}
                      className="tag-pill-link"
                      to={ClientRoutes.TAG_DETAILS.replace(
                        ":id",
                        String(tag.id),
                      )}
                    >
                      {tag.label}
                    </Link>
                  ))
                ) : (
                  <span className="detail-muted">No tags</span>
                )}
              </div>
            </div>
          </section>

          <footer className="detail-meta">
            <p>
              <strong>Created:</strong> {formatDate(experience.dateCreated)}
            </p>
            <p>
              <span aria-hidden="true" style={{ marginRight: 4 }}>
                👤
              </span>
              <strong>Created By:</strong>{" "}
              {experience.createdByUsername ?? "Unknown"}
            </p>
            {experience.lastUpdated &&
              experience.lastUpdated !== experience.dateCreated && (
                <p>
                  <strong>Updated:</strong> {formatDate(experience.lastUpdated)}
                </p>
              )}
          </footer>

          <section className="reviews-header-group">
            <h2>Reviews</h2>
            <div className="sort-controls">
              <label htmlFor="review-sort">Sort by: </label>
              <select
                id="review-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
                <option value="media">With Photos</option>
              </select>
            </div>
          </section>

          <section id="reviews">
            <ReviewsSection
              experienceId={String(experience.id)}
              isOwner={canManageExperience}
            />
          </section>
        </div>
      </article>

      {tripPickerOpen && (
        <div
          className="trip-picker-backdrop"
          onClick={() => setTripPickerOpen(false)}
          role="presentation"
        >
          <section
            className="trip-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="trip-picker-header">
              <h2 id="trip-picker-title">Add To Trip</h2>
              <button
                type="button"
                className="trip-picker-close"
                onClick={() => setTripPickerOpen(false)}
                aria-label="Close add to trip dialog"
              >
                ×
              </button>
            </header>

            {tripPickerLoading ? (
              <p className="trip-picker-status">Loading your trips...</p>
            ) : tripPickerError ? (
              <div className="trip-picker-status trip-picker-status--error">
                <p>{tripPickerError}</p>
                <button
                  type="button"
                  className="trip-picker-retry"
                  onClick={() => void loadOwnedTrips()}
                >
                  Try Again
                </button>
              </div>
            ) : userTrips.length === 0 ? (
              <div className="trip-picker-status">
                <p>You don&apos;t have any trips yet.</p>
                <button
                  type="button"
                  className="trip-picker-create"
                  onClick={() => navigate(ClientRoutes.TRIP_CREATE)}
                >
                  Create Trip
                </button>
              </div>
            ) : (
              <ul className="trip-picker-list">
                {userTrips.map((trip) => (
                  <li key={trip.id} className="trip-picker-item">
                    <button
                      type="button"
                      className="trip-picker-item-btn"
                      onClick={() => void handleAddToTrip(trip.id)}
                      disabled={addingToTripId === trip.id}
                    >
                      <span className="trip-picker-item-title">{trip.title}</span>
                      <span className="trip-picker-item-meta">
                        {new Date(trip.dateCreated).toLocaleDateString()}
                      </span>
                      {trip.description ? (
                        <span className="trip-picker-item-desc">
                          {trip.description.length > 90
                            ? `${trip.description.slice(0, 90)}...`
                            : trip.description}
                        </span>
                      ) : null}
                      <span className="trip-picker-item-action">
                        {addingToTripId === trip.id ? "Adding..." : "Add to this trip"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
