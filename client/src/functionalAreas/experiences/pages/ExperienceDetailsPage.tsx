import ReviewsSection from "../../reviews/components/ReviewSection";

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { useAuth } from "../../auth/hooks/useAuth";
import "./ExperienceDetailPage.css";

type ExperienceTag = {
  id: number | string;
  label: string;
  slug: string;
  type: "CATEGORY" | "FEATURE";
  parentCategoryId?: number | null;
};

type Experience = {
  id: number | string;
  title: string;
  description: string;
  dateCreated: string;
  lastUpdated?: string;
  thumbnail?: string;
  keywords?: string[];
  country?: string;
  city?: string;
  adminRegion?: string;
  street?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  avgRating?: number | null;
  createdBy?: number | string;
  categoryTags?: ExperienceTag[];
  featureTags?: ExperienceTag[];
};

export default function ExperienceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const previewExperience = (
    location.state as { experience?: Experience } | null
  )?.experience;

  const previewMatchesRoute =
    Boolean(previewExperience) &&
    Boolean(id) &&
    String(previewExperience?.id) === id;

  const [experience, setExperience] = useState<Experience | null>(() =>
    previewMatchesRoute && previewExperience
      ? {
          ...previewExperience,
          lastUpdated:
            previewExperience.lastUpdated ?? previewExperience.dateCreated,
        }
      : null
  );

  const [loading, setLoading] = useState(!previewMatchesRoute);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    if (!id) {
      setError("No experience ID provided");
      setLoading(false);
      return;
    }

    if (previewMatchesRoute && previewExperience) {
      setExperience({
        ...previewExperience,
        lastUpdated: previewExperience.lastUpdated ?? previewExperience.dateCreated,
      });
      setLoading(false);
    } else {
      setExperience(null);
      setLoading(true);
    }

    setError(null);

    apiClient
      .get(`/experiences/${id}`)
      .then((res) => {
        setExperience(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!previewMatchesRoute) {
          setError("Failed to load experience");
        }
        setLoading(false);
      });
  }, [id, previewExperience, previewMatchesRoute]);

  const handleDelete = async () => {
    if (!id || !experience) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this experience? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/experiences/${id}`);
      alert("Experience deleted successfully!");
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLocationString = (exp: Experience) => {
    const parts = [];
    if (exp.street) parts.push(exp.street);
    if (exp.city) parts.push(exp.city);
    if (exp.adminRegion) parts.push(exp.adminRegion);
    if (exp.country) parts.push(exp.country);
    if (exp.postalCode) parts.push(`(${exp.postalCode})`);
    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  };

  const isOwner =
    Boolean(user) &&
    Boolean(experience) &&
    experience?.createdBy !== undefined &&
    String(user?.id) === String(experience.createdBy);

  if (loading && !experience) {
    return (
      <main className="experience-detail-page">
        <div className="loading">Loading experience...</div>
      </main>
    );
  }

  if (!experience) {
    return (
      <main className="experience-detail-page">
        <div className="error">
          <p>{error || "Experience not found"}</p>
          <button onClick={() => navigate(ClientRoutes.HOME)}>Go Home</button>
        </div>
      </main>
    );
  }

  return (
    <main className="experience-detail-page">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        {isOwner && (
          <div className="owner-actions">
            <button
              className="edit-button"
              onClick={() =>
                navigate(ClientRoutes.EXPERIENCE_UPDATE.replace(":id", id!))
              }
            >
              Edit
            </button>
            <button
              className="delete-button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      <div className="experience-detail">
        {experience.thumbnail && (
          <div className="detail-image">
            <img src={experience.thumbnail} alt={experience.title} />
          </div>
        )}

        <div className="detail-content">
          <h1>{experience.title}</h1>

          {experience.avgRating !== null &&
            experience.avgRating !== undefined && (
              <div className="detail-rating">
                Rating: {experience.avgRating.toFixed(1)} / 5.0
              </div>
            )}

          <div className="detail-section">
            <h2>Description</h2>
            <p>{experience.description}</p>
          </div>

          <div className="detail-section">
            <h2>Location</h2>
            <p>{getLocationString(experience)}</p>
            {experience.latitude != null && experience.longitude != null && (
              <p className="coordinates">
                Coordinates: {experience.latitude}, {experience.longitude}
              </p>
            )}
          </div>

          {experience.keywords && experience.keywords.length > 0 && (
            <div className="detail-section">
              <h2>Keywords</h2>
              <div className="detail-keywords">
                {experience.keywords.map((keyword, idx) => (
                  <span key={idx} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {experience.categoryTags && experience.categoryTags.length > 0 && (
            <div className="detail-section">
              <h2>Category Tags</h2>
              <div className="detail-keywords">
                {experience.categoryTags.map((tag) => (
                  <span key={tag.id} className="keyword-tag">
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {experience.featureTags && experience.featureTags.length > 0 && (
            <div className="detail-section">
              <h2>Feature Tags</h2>
              <div className="detail-keywords">
                {experience.featureTags.map((tag) => (
                  <span key={tag.id} className="keyword-tag">
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-meta">
            <p>
              <strong>Created:</strong> {formatDate(experience.dateCreated)}
            </p>
            {experience.lastUpdated &&
              experience.lastUpdated !== experience.dateCreated && (
                <p>
                  <strong>Last Updated:</strong> {formatDate(experience.lastUpdated)}
                </p>
              )}
          </div>

          {/* =========================
              REVIEWS (Teammate work area)
              File: src/features/reviews/components/ReviewsSection/ReviewsSection.tsx
              API:  src/features/reviews/api/reviews.api.ts
              Types: src/features/reviews/types/review.ts
              Props provided:
              - experienceId (string)
              - isOwner (boolean)
             ========================= */}
          <ReviewsSection experienceId={String(experience.id)} isOwner={isOwner} />
        </div>
      </div>
    </main>
  );
}
