import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  setAuthToken,
  getInterests,
  createInterest,
  updateInterest,
  deleteInterest,
  getMyLikedExperiences,
  getMyLikedTags,
  getMyLikedTrips,
  type Interest,
} from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import "./InterestsPage.css";

function getCurrentUserIdFromToken(): number | null {
  const token = localStorage.getItem("cstp.auth.token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { id?: number | string };
    if (typeof payload.id === "number") return payload.id;
    if (typeof payload.id === "string") {
      const n = Number(payload.id);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  } catch {
    return null;
  }
}

type LikedExp = Awaited<ReturnType<typeof getMyLikedExperiences>>[number];
type LikedTag = Awaited<ReturnType<typeof getMyLikedTags>>[number];
type LikedTrip = Awaited<ReturnType<typeof getMyLikedTrips>>[number];

export default function InterestsPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [likedExperiences, setLikedExperiences] = useState<LikedExp[]>([]);
  const [likedTags, setLikedTags] = useState<LikedTag[]>([]);
  const [likedTrips, setLikedTrips] = useState<LikedTrip[]>([]);
  const [likesLoading, setLikesLoading] = useState(true);

  const currentUserId = useMemo(() => getCurrentUserIdFromToken(), []);

  const myAuthoredInterests = useMemo(() => {
    if (currentUserId === null) return [];
    return interests.filter((i) => i.createdBy === currentUserId);
  }, [interests, currentUserId]);

  const loadInterests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInterests();
      setInterests(data);
    } catch (err) {
      console.error("Failed to load interests:", err);
      let message = "Failed to load interests";
      if (err && typeof err === "object" && "response" in err) {
        const data = (err as { response?: { data?: { error?: unknown; message?: unknown } } })
          .response?.data;
        if (data?.error != null) message = String(data.error);
        else if (data?.message != null) message = String(data.message);
      } else if (err instanceof Error && err.message) {
        message = err.message.includes("Network Error")
          ? "Cannot reach server. Is the API running on port 10000?"
          : message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLikes = useCallback(async () => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setLikesLoading(false);
      return;
    }
    setAuthToken(token);
    try {
      setLikesLoading(true);
      const [exps, tags, trips] = await Promise.all([
        getMyLikedExperiences(),
        getMyLikedTags(),
        getMyLikedTrips(),
      ]);
      setLikedExperiences(exps);
      setLikedTags(tags);
      setLikedTrips(trips);
    } catch (err) {
      console.error("Failed to load saved items:", err);
    } finally {
      setLikesLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);
    loadInterests();
    void loadLikes();
  }, [loadInterests, loadLikes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem("cstp.auth.token");
      if (!token) {
        setError("Please login first");
        return;
      }

      setAuthToken(token);

      if (editingId) {
        await updateInterest(editingId, formData);
      } else {
        await createInterest(formData);
      }

      setFormData({ name: "", description: "" });
      setShowForm(false);
      setEditingId(null);
      await loadInterests();
    } catch (err: unknown) {
      console.error("Error saving interest:", err);
      let errorMessage = "Failed to save interest";

      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { error?: unknown; message?: unknown } } }).response;
        if (response?.data) {
          errorMessage = String(response.data.error || response.data.message || errorMessage);
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  const handleEdit = (interest: Interest) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setError("Please login first");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const uid = payload.id as number;

      if (interest.createdBy !== uid) {
        setError("You can only edit your own interests");
        return;
      }
    } catch (err) {
      console.error("Error decoding token:", err);
    }

    setFormData({
      name: interest.name,
      description: interest.description || "",
    });
    setEditingId(interest.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this interest?")) return;

    try {
      const token = localStorage.getItem("cstp.auth.token");
      if (token) setAuthToken(token);
      await deleteInterest(id);
      await loadInterests();
    } catch (err: unknown) {
      let errorMessage = "Failed to delete interest";

      if (err && typeof err === "object" && "response" in err) {
        const response = (err as {
          response?: { data?: { error?: unknown; message?: unknown } };
        }).response;
        if (response?.data) {
          errorMessage = String(
            response.data.error || response.data.message || errorMessage
          );
        }
      }

      setError(errorMessage);
    }
  };

  return (
    <main className="interests-page">
      <header className="interests-header">
        <p className="interests-header__eyebrow">Saved Preferences</p>
        <h1 className="interests-title-main">My Interests</h1>
        <p className="interests-page-intro">
          Your own interest notes (Local) and things you saved from the community.
        </p>
      </header>

      {error && <div className="interests-error">{error}</div>}

      <div className="interests-two-col">
        <section className="interests-col">
          <h2 className="interests-col-title">Local</h2>
          <p className="interests-col-desc">
            Create and edit your own interest notes. Only entries you created appear in this list.
          </p>

          <button
            className="interests-primary-btn"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: "", description: "" });
            }}
          >
            {showForm ? "Cancel" : "+ Add New Interest"}
          </button>

          {showForm && (
            <form className="interests-form" onSubmit={handleSubmit}>
              <h3>{editingId ? "Edit Interest" : "Create New Interest"}</h3>
              <div className="interests-form-field">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="interests-form-field">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={500}
                  rows={3}
                />
              </div>
              <button type="submit" className="interests-primary-btn">
                {editingId ? "Update" : "Create"}
              </button>
            </form>
          )}

          {loading ? (
            <p className="interests-note">Loading…</p>
          ) : myAuthoredInterests.length === 0 ? (
            <p className="interests-note">
              No interests authored by you yet. Add one above.
            </p>
          ) : (
            <div>
              <h3 className="interests-subheading">
                Your entries ({myAuthoredInterests.length})
              </h3>
              {myAuthoredInterests.map((interest) => (
                <article key={interest.id} className="interests-entry-card">
                  <div className="interests-entry-card__content">
                    <h4>{interest.name}</h4>
                    {interest.description ? <p>{interest.description}</p> : null}
                    <small>
                      Created: {new Date(interest.dateCreated).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="interests-entry-card__actions">
                    <button
                      className="interests-secondary-btn"
                      onClick={() => handleEdit(interest)}
                    >
                      Edit
                    </button>
                    <button
                      className="interests-danger-btn"
                      onClick={() => handleDelete(interest.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="interests-col">
          <h2 className="interests-col-title">Community</h2>
          <p className="interests-col-desc">
            Experiences, trips, and tags you marked with the heart. Saving a tag helps you reuse it quickly when writing a new experience.
          </p>

          {likesLoading ? (
            <p className="interests-note">Loading saved items…</p>
          ) : (
            <>
              <h3 className="interests-subheading">Experiences</h3>
              {likedExperiences.length === 0 ? (
                <p className="interests-note interests-note--section">
                  None yet. Open an experience and tap the heart to save it here.
                </p>
              ) : (
                <ul className="interests-saved-list">
                  {likedExperiences.map((exp) => (
                    <li key={exp.id} className="interests-saved-item">
                      <Link
                        className="interests-link"
                        to={ClientRoutes.EXPERIENCE_DETAILS.replace(":id", String(exp.id))}
                      >
                        {exp.title}
                      </Link>
                      {exp.createdByUsername ? (
                        <span>· {exp.createdByUsername}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="interests-subheading">Tags</h3>
              {likedTags.length === 0 ? (
                <p className="interests-note interests-note--section">
                  None yet. Open a tag page (from an experience) and save the tag.
                </p>
              ) : (
                <ul className="interests-saved-list">
                  {likedTags.map((t) => (
                    <li key={t.id} className="interests-saved-item">
                      <Link
                        className="interests-link"
                        to={ClientRoutes.TAG_DETAILS.replace(":id", String(t.id))}
                      >
                        {t.label}
                      </Link>
                      {t.category?.label ? (
                        <span>· {t.category.label}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="interests-subheading">Trips</h3>
              {likedTrips.length === 0 ? (
                <p className="interests-note interests-note--section">
                  None yet. Tap the heart next to a trip on your home dashboard to save it here.
                </p>
              ) : (
                <ul className="interests-saved-list interests-saved-list--final">
                  {likedTrips.map((tr) => (
                    <li key={tr.id} className="interests-saved-item">
                      <Link
                        className="interests-link"
                        to={ClientRoutes.TRIP_DETAILS.replace(":id", String(tr.id))}
                      >
                        {tr.title}
                      </Link>
                      {tr.createdByUsername ? (
                        <span>· {tr.createdByUsername}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>

      <div className="interests-back-row">
        <button className="interests-back-btn" onClick={() => navigate(ClientRoutes.HOME)}>
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
