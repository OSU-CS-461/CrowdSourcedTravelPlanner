import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../services/api.service";
import { ClientRoutes } from "../utils/clientRoutes";

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  thumbnail?: string;
  keywords?: string[];
  country?: string;
  city?: string;
  adminRegion?: string;
};

function HomePage() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    apiClient
      .get("/experiences")
      .then((res) => setExperiences(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to remove this experience?")) {
      try {
        await apiClient.delete(`/experiences/${id}`);
        setExperiences(experiences.filter((exp) => exp.id !== id));
      } catch (err) {
        console.error("Failed to delete experience:", err);
        alert("Could not remove the experience. Please try again.");
      }
    }
  };

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", textAlign: "left" }}>
      <h1>Welcome to CrowdSourced Travel Planner</h1>
      <p>Your authenticated travel dashboard.</p>

      <button
        onClick={() => navigate(ClientRoutes.EXPERIENCE_CREATE)}
        style={{
          padding: "10px 20px",
          marginTop: "16px",
          marginBottom: "32px",
          cursor: "pointer",
          backgroundColor: "#1a73e8",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold"
        }}
      >
        + Create New Experience
      </button>

      {experiences.length === 0 ? (
        <p>No experiences found. Start by creating one!</p>
      ) : (
        <div className="search-results-container">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "20px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2
                  onClick={() => navigate(`/experience/${exp.id}`)}
                  style={{
                    color: "#1a0dab",
                    cursor: "pointer",
                    margin: "0 0 4px 0",
                    fontSize: "1.2rem",
                  }}
                >
                  {exp.title}
                </h2>

                <div style={{ color: "#006621", fontSize: "14px", marginBottom: "5px" }}>
                  {exp.city ? `${exp.city}, ` : ""}{exp.adminRegion ? `${exp.adminRegion}, ` : ""}{exp.country || "Global"} —{" "}
                  {new Date(exp.dateCreated).toLocaleDateString()}
                </div>

                <p style={{ color: "#4d5156", margin: "0", lineHeight: "1.4", fontSize: "15px", maxWidth: "90%" }}>
                  {exp.description && exp.description.length > 160
                    ? exp.description.substring(0, 160) + "..."
                    : exp.description || "Discover more about this hidden gem..."}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  alignItems: "flex-end",
                  marginLeft: "20px",
                }}
              >
                <button
                  onClick={() => navigate(ClientRoutes.EXPERIENCE_UPDATE.replace(":id", exp.id.toString()))}
                  style={{
                    background: "#f1f3f4",
                    border: "1px solid #dadce0",
                    borderRadius: "4px",
                    color: "#1a73e8",
                    cursor: "pointer",
                    padding: "4px 12px",
                    fontSize: "12px",
                    width: "80px",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(exp.id)}
                  style={{
                    background: "#f1f3f4",
                    border: "1px solid #dadce0",
                    borderRadius: "4px",
                    color: "#d93025",
                    cursor: "pointer",
                    padding: "4px 12px",
                    fontSize: "12px",
                    width: "80px",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default HomePage;