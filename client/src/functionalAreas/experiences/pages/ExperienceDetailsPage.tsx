import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
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
        {canManageExperience && (
          <div className="toolbar-actions">
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
          </div>
        )}
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
                    <span key={tag.id} className="tag-pill">
                      {tag.label}
                    </span>
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
    </main>
  );
}
