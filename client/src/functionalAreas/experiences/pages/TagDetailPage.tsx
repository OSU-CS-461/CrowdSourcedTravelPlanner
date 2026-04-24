import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import {
  apiClient,
  getMyLikedTagsStatus,
  getTagById,
  likeTag,
  setAuthToken,
  unlikeTag,
  type LikedTagSummary,
} from "../../../shared/services/api.service";
import type { Experience } from "../types/types";
import "./TagDetailPage.css";

export default function TagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tag, setTag] = useState<LikedTagSummary | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeStatusLoaded, setLikeStatusLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      setError("Missing tag id");
      setLoading(false);
      return;
    }
    const tagId = Number(id);
    if (!Number.isFinite(tagId) || tagId <= 0) {
      setError("Invalid tag id");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    setLoading(true);
    setError(null);
    try {
      const tagRow = await getTagById(tagId);
      setTag(tagRow);

      const expRes = await apiClient.get<Experience[]>("/experiences", {
        params: { tags: tagRow.slug, limit: 50 },
      });
      setExperiences(expRes.data);

      if (token) {
        try {
          const { liked: isLiked } = await getMyLikedTagsStatus(tagId);
          setLiked(isLiked);
        } catch {
          setLiked(false);
        }
        setLikeStatusLoaded(true);
      } else {
        setLikeStatusLoaded(true);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load this tag.");
      setTag(null);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggleTagLike() {
    if (!tag || likeLoading) return;
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("Please sign in to save tags.");
      return;
    }
    setAuthToken(token);
    setLikeLoading(true);
    try {
      if (liked) {
        await unlikeTag(tag.id);
        setLiked(false);
      } else {
        await likeTag(tag.id);
        setLiked(true);
      }
    } catch (e) {
      console.error(e);
      alert("Could not update saved tag.");
    } finally {
      setLikeLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="tag-detail-page">
        <p className="tag-detail-meta">Loading tag…</p>
      </main>
    );
  }

  if (error || !tag) {
    return (
      <main className="tag-detail-page">
        <p>{error || "Tag not found."}</p>
        <button type="button" onClick={() => navigate(ClientRoutes.HOME)}>
          Home
        </button>
      </main>
    );
  }

  return (
    <main className="tag-detail-page">
      <div className="tag-detail-toolbar">
        <div>
          <button type="button" className="toolbar-back" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1>{tag.label}</h1>
          <p className="tag-detail-meta">
            {tag.category?.label ?? "Category"} · {experiences.length} experience
            {experiences.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          className={`tag-detail-like${liked ? " is-liked" : ""}`}
          onClick={() => void handleToggleTagLike()}
          disabled={likeLoading || !likeStatusLoaded}
          title={liked ? "Remove tag from saved" : "Save tag"}
          aria-pressed={liked}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      {experiences.length === 0 ? (
        <p className="tag-detail-meta">No experiences use this tag yet.</p>
      ) : (
        <ul className="tag-detail-list">
          {experiences.map((exp) => (
            <li key={exp.id}>
              <Link
                to={ClientRoutes.EXPERIENCE_DETAILS.replace(":id", String(exp.id))}
              >
                <p className="exp-title">{exp.title}</p>
                <p className="exp-sub">
                  {exp.city && exp.country
                    ? `${exp.city}, ${exp.country}`
                    : exp.country ?? ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
