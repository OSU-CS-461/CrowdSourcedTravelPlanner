import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";

type ExperienceTag = {
  id: number;
  label: string;
  slug: string;
  type?: "CATEGORY" | "FEATURE";
  categoryId?: number | null;
  parentCategoryId?: number | null;
};

type ExperienceCategory = {
  id: number;
  label: string;
  slug: string;
};

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  thumbnail?: string;
  country?: string;
  city?: string;
  adminRegion?: string;
  category?: ExperienceCategory | null;
  tags?: ExperienceTag[];
  categoryTags?: ExperienceTag[];
  featureTags?: ExperienceTag[];
};

export default function HomePage() {
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
            (() => {
              const categoryTags =
                exp.categoryTags ??
                (exp.category
                  ? [
                      {
                        id: exp.category.id,
                        label: exp.category.label,
                        slug: exp.category.slug,
                      },
                    ]
                  : []);

              const featureTags = exp.featureTags ?? exp.tags ?? [];

              return (
            <div
              key={exp.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "20px 0",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "160px",
                  height: "120px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#f1f3f4",
                  flexShrink: 0,
                }}
              >
                {exp.thumbnail ? (
                  <img
                    src={exp.thumbnail}
                    alt={exp.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : null}
              </div>

              <div style={{ flex: 1 }}>
                <h2
                  onClick={() =>
                    navigate(
                      ClientRoutes.EXPERIENCE_DETAILS.replace(
                        ":id",
                        exp.id.toString()
                      ),
                      {
                        state: { experience: exp },
                      }
                    )
                  }
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

              <aside style={{ width: "220px", flexShrink: 0 }}>
                {categoryTags.length > 0 && (
                  <div style={{ marginBottom: "8px" }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#5f6368" }}>
                      Category
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {categoryTags.map((tag) => (
                        <span
                          key={`cat-${tag.id}`}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: "#e8f0fe",
                            color: "#174ea6",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {featureTags.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#5f6368" }}>
                      Tags
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {featureTags.map((tag) => (
                        <span
                          key={`tag-${tag.id}`}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: "#f1f3f4",
                            color: "#3c4043",
                            fontSize: "12px",
                          }}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
              );
            })()
          ))}
        </div>
      )}
    </main>
  );
}
