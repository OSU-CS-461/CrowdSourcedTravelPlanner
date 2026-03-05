import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  setAuthToken,
  getInterests,
  createInterest,
  updateInterest,
  deleteInterest,
  type Interest,
} from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";

export default function InterestsPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);
    loadInterests();
  }, [loadInterests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem("cstp.auth.token");
      if (!token) {
        setError("Please login first");
        return;
      }
      
      // Ensure token is set before API call
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
    // Check if user owns this interest
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setError("Please login first");
      return;
    }
    
    // Decode token to get user ID (simple base64 decode of payload)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.id;
      
      if (interest.createdBy !== currentUserId) {
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
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ color: "#fff", marginBottom: "8px" }}>My Interests</h1>
      <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 0, marginBottom: "20px" }}>
        Manage your travel interests and preferences
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
            backgroundColor: "#2d2d2d",
            padding: "24px",
            borderRadius: "8px",
            marginBottom: "30px",
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
        <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading interests...</p>
      ) : interests.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.7)" }}>No interests yet. Create your first one!</p>
      ) : (
        <div>
          <h2 style={{ color: "#fff", marginBottom: "16px" }}>Your Interests ({interests.length})</h2>
          {interests.map((interest) => (
            <div
              key={interest.id}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "15px",
                backgroundColor: "#2d2d2d",
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
                  <h3 style={{ margin: "0 0 10px 0", color: "#6ea8fe" }}>
                    {interest.name}
                  </h3>
                  {interest.description && (
                    <p style={{ color: "#b0b0b0", margin: "0 0 10px 0" }}>
                      {interest.description}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      margin: "0",
                    }}
                  >
                    Created: {new Date(interest.dateCreated).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {(() => {
                    const token = localStorage.getItem("cstp.auth.token");
                    let canEdit = false;
                    if (token) {
                      try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        canEdit = interest.createdBy === payload.id;
                      } catch (err) {
                        console.error("Error decoding token:", err);
                      }
                    }
                    return canEdit ? (
                      <>
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
                      </>
                    ) : (
                      <span style={{ color: "#888", fontSize: "12px" }}>
                        (Not yours)
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
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
