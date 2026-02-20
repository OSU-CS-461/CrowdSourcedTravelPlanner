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
import "./HomePage.css";

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  thumbnail?: string;
  country?: string;
  city?: string;
  adminRegion?: string;
};

type Trip = {
  id: number;
  title: string;
  description?: string;
  dateCreated: string;
};

export default function HomePage() {
  const navigate = useNavigate();

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    apiClient
      .get("/experiences")
      .then((res) => setExperiences(res.data))
      .catch((err) => console.error(err));

    apiClient
      .get("/trips")
      .then((res) => setTrips(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <main className="page-container">
      <h1>Welcome to CrowdSourced Travel Planner</h1>
      <p>Your authenticated travel dashboard.</p>

      {/* Create Buttons */}
      <div className="button-group">
        <button
          className="btn btn-experience"
          onClick={() => navigate(ClientRoutes.EXPERIENCE_CREATE)}
        >
          + Create New Experience
        </button>

        <button
          className="btn btn-trip"
          onClick={() => navigate(ClientRoutes.TRIP_CREATE)}
        >
          + Create New Trip
        </button>
      </div>

      {/* EXPERIENCES SECTION */}
      <h2>Your Experiences</h2>

      {experiences.length === 0 ? (
        <p>No experiences found. Start by creating one!</p>
      ) : (
        <div>
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

              <div className="card-meta">
                {exp.city ? `${exp.city}, ` : ""}
                {exp.adminRegion ? `${exp.adminRegion}, ` : ""}
                {exp.country || "Global"} —{" "}
                {new Date(exp.dateCreated).toLocaleDateString()}
              </div>

              <p className="card-description">
                {exp.description && exp.description.length > 160
                  ? exp.description.substring(0, 160) + "..."
                  : exp.description ||
                    "Discover more about this hidden gem..."}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TRIPS SECTION */}
      <h2 className="section-title">Your Trips</h2>

      {trips.length === 0 ? (
        <p>No trips found. Create one!</p>
      ) : (
        <div>
          {trips.map((trip) => (
            <div key={trip.id} className="card">
              <h2
                className="card-title"
                onClick={() =>
                  navigate(
                    ClientRoutes.TRIP_DETAILS.replace(// need to create detailed trips page and add routes
                      ":id",
                      trip.id.toString()
                    )
                  )
                }
              >
                {trip.title}
              </h2>

              <div className="card-meta">
                {new Date(trip.dateCreated).toLocaleDateString()}
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

              <p className="card-description">
                {trip.description || "Plan your next adventure."}
              </p>
            </div>
              );
            })()
          ))}
        </div>
      )}
    </main>
  );
}