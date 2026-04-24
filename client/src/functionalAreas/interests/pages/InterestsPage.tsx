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
  type Interest,
} from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";

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
      setError("Failed to load interests");
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
      const [exps, tags] = await Promise.all([
        getMyLikedExperiences(),
        getMyLikedTags(),
      ]);
      setLikedExperiences(exps);
      setLikedTags(tags);
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

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "#2d2d2d",
    border: "1px solid #444",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  };

  const subHeading: React.CSSProperties = {
    color: "#fff",
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "1.1rem",
  };

  return (
    <main style={{ maxWidth: "880px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ color: "#fff", marginBottom: "8px" }}>My Interests</h1>
      <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 0, marginBottom: "24px" }}>
        Your written interests and things you have saved from the community.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: "#fee",
            color: "#c00",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <section style={sectionStyle}>
        <h2 style={{ ...subHeading, marginBottom: "16px" }}>Self-authored</h2>
        <p style={{ color: "rgba(255,255,255,0.72)", marginTop: 0, fontSize: "0.95rem" }}>
          Create and edit your own interest notes. Only entries you created appear in this list.
        </p>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: "", description: "" });
          }}
          style={{
            padding: "10px 20px",
            marginBottom: "20px",
            cursor: "pointer",
            backgroundColor: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          {showForm ? "Cancel" : "+ Add New Interest"}
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "#1e1e1e",
              padding: "24px",
              borderRadius: "8px",
              marginBottom: "24px",
              border: "1px solid #444",
            }}
          >
            <h3 style={{ color: "#fff", marginTop: 0, marginBottom: "20px" }}>
              {editingId ? "Edit Interest" : "Create New Interest"}
            </h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#e0e0e0", fontWeight: 500 }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                minLength={2}
                maxLength={100}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#e0e0e0", fontWeight: 500 }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                maxLength={500}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                backgroundColor: "#1a73e8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {editingId ? "Update" : "Create"}
            </button>
          </form>
        )}

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading…</p>
        ) : myAuthoredInterests.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            No interests authored by you yet. Add one above.
          </p>
        ) : (
          <div>
            <h3 style={{ color: "#fff", marginBottom: "16px", fontSize: "1rem" }}>
              Your entries ({myAuthoredInterests.length})
            </h3>
            {myAuthoredInterests.map((interest) => (
              <div
                key={interest.id}
                style={{
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "15px",
                  backgroundColor: "#1a1a1a",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#6ea8fe" }}>
                      {interest.name}
                    </h4>
                    {interest.description && (
                      <p style={{ color: "#b0b0b0", margin: "0 0 10px 0" }}>
                        {interest.description}
                      </p>
                    )}
                    <p style={{ fontSize: "12px", color: "#888", margin: "0" }}>
                      Created: {new Date(interest.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleEdit(interest)}
                      style={{
                        padding: "5px 15px",
                        marginRight: "10px",
                        cursor: "pointer",
                        backgroundColor: "#34a853",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(interest.id)}
                      style={{
                        padding: "5px 15px",
                        cursor: "pointer",
                        backgroundColor: "#ea4335",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={subHeading}>Saved from the community</h2>
        <p style={{ color: "rgba(255,255,255,0.72)", marginTop: 0, fontSize: "0.95rem" }}>
          Experiences and tags you marked with the heart. Saving a tag helps you reuse it quickly when writing a new experience.
        </p>

        {likesLoading ? (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading saved items…</p>
        ) : (
          <>
            <h3 style={{ ...subHeading, fontSize: "1rem" }}>Experiences</h3>
            {likedExperiences.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "24px" }}>
                None yet. Open an experience and tap the heart to save it here.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0" }}>
                {likedExperiences.map((exp) => (
                  <li
                    key={exp.id}
                    style={{
                      marginBottom: "10px",
                      borderBottom: "1px solid #444",
                      paddingBottom: "10px",
                    }}
                  >
                    <Link
                      to={ClientRoutes.EXPERIENCE_DETAILS.replace(":id", String(exp.id))}
                      style={{ color: "#8ab4ff", fontWeight: 600 }}
                    >
                      {exp.title}
                    </Link>
                    {exp.createdByUsername ? (
                      <span style={{ color: "#888", marginLeft: "8px", fontSize: "0.85rem" }}>
                        · {exp.createdByUsername}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <h3 style={{ ...subHeading, fontSize: "1rem" }}>Tags</h3>
            {likedTags.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.65)" }}>
                None yet. Open a tag page (from an experience) and save the tag.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {likedTags.map((t) => (
                  <li key={t.id} style={{ marginBottom: "10px" }}>
                    <Link
                      to={ClientRoutes.TAG_DETAILS.replace(":id", String(t.id))}
                      style={{ color: "#8ab4ff", fontWeight: 600 }}
                    >
                      {t.label}
                    </Link>
                    {t.category?.label ? (
                      <span style={{ color: "#888", marginLeft: "8px", fontSize: "0.85rem" }}>
                        · {t.category.label}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => navigate(ClientRoutes.HOME)}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
