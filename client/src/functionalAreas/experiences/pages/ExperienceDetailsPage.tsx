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
  images: Array<{
    id: string | number;
    url: string;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    originalFilename?: string | null;
    mediaType?: "IMAGE" | "VIDEO";
  }>;
  media: Array<{
    id: string | number;
    url: string;
    type: "image" | "video";
    mediaType?: "IMAGE" | "VIDEO";
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    originalFilename?: string | null;
    alt?: string;
  }>;
};

type ExperiencePayload = Omit<Experience, "images"> & {
  images?: Array<
    string | { id?: string | number; url?: string | null; mimeType?: string | null; fileSizeBytes?: number | null; originalFilename?: string | null; mediaType?: "IMAGE" | "VIDEO" } | null
  > | null;
  media?: Array<{
    id?: string | number;
    url?: string | null;
    type?: "image" | "video";
    mediaType?: "IMAGE" | "VIDEO";
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    originalFilename?: string | null;
    alt?: string;
  } | null> | null;
};

function normalizeImages(images: ExperiencePayload["images"]): Experience["images"] {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (typeof image === "string" && image.trim().length > 0) {
        return {
          id: image,
          url: image,
          mimeType: null,
          fileSizeBytes: null,
          originalFilename: null,
          mediaType: "IMAGE" as const,
        };
      }
      if (
        image &&
        typeof image === "object" &&
        typeof image.url === "string" &&
        image.url.trim().length > 0
      ) {
        return {
          id: image.id ?? image.url,
          url: image.url,
          mimeType: image.mimeType ?? null,
          fileSizeBytes: image.fileSizeBytes ?? null,
          originalFilename: image.originalFilename ?? null,
          mediaType: image.mediaType ?? "IMAGE",
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function normalizeMedia(payload: ExperiencePayload): Experience["media"] {
  if (Array.isArray(payload.media) && payload.media.length > 0) {
    return payload.media
      .map((item) => {
        if (!item || typeof item.url !== "string" || item.url.trim().length === 0) {
          return null;
        }
        const type = item.type === "video" || item.mediaType === "VIDEO" ? "video" : "image";
        return {
          id: item.id ?? item.url,
          url: item.url.trim(),
          type,
          mediaType: item.mediaType ?? (type === "video" ? "VIDEO" : "IMAGE"),
          mimeType: item.mimeType ?? null,
          fileSizeBytes: item.fileSizeBytes ?? null,
          originalFilename: item.originalFilename ?? null,
          alt: item.alt ?? "",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  return normalizeImages(payload.images).map((image) => ({
    id: image.id,
    url: image.url,
    type: "image" as const,
    mediaType: "IMAGE" as const,
    mimeType: image.mimeType ?? null,
    fileSizeBytes: image.fileSizeBytes ?? null,
    originalFilename: image.originalFilename ?? null,
    alt: "",
  }));
}

function normalizeExperience(experience: ExperiencePayload): Experience {
  const images = normalizeImages(experience.images);
  const media = normalizeMedia(experience);
  return {
    ...experience,
    lastUpdated: experience.lastUpdated ?? experience.dateCreated,
    images,
    media,
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
  const { user } = useAuth();

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
          media={experience.media}
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
                <option value="media">With Media</option>
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
    </main>
  );
}
