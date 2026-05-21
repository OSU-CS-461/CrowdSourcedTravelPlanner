import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  USER_ID_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "../../auth/context/auth-context";
import "./TripDetailsPage.css";

type Experience = {
  id: number;
  title: string;
  description?: string;
  city?: string;
  country?: string;
  thumbnail?: string | null;
};

type TripExperience = {
  experience: Experience;
};

type Trip = {
  id: number;
  title: string;
  description?: string;
  dateCreated: string;
  lastUpdated: string;
  createdBy: number;
  startDate?: string | null;
  endDate?: string | null;
  experiences: TripExperience[];
};

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23eef2f7'/><stop offset='100%' stop-color='%23d8dee8'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><rect x='450' y='285' width='300' height='190' rx='20' fill='%23c7d0dc'/><circle cx='530' cy='350' r='26' fill='%23b2bcc9'/><path d='M470 445l90-84 74 60 50-40 66 64z' fill='%23a7b2c0'/><text x='600' y='540' text-anchor='middle' font-family='Arial,sans-serif' font-size='44' fill='%23738091'>No Image</text></svg>";

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<number | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const userId = useMemo(() => {
    if (user?.id !== undefined && user?.id !== null) return Number(user.id);

    const legacyUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (legacyUserId) {
      const parsedLegacy = Number(legacyUserId);
      if (!Number.isNaN(parsedLegacy)) return parsedLegacy;
    }

    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: string | number };
      if (parsed.id === undefined || parsed.id === null) return null;
      const parsedId = Number(parsed.id);
      return Number.isNaN(parsedId) ? null : parsedId;
    } catch {
      return null;
    }
  }, [user?.id]);

  const loadTrip = useCallback(async () => {
    try {
      const token = localStorage.getItem("cstp.auth.token");
      if (token) setAuthToken(token);

      const res = await apiClient.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (err) {
      console.error("Error loading trip", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadExperiences = useCallback(async () => {
    try {
      const res = await apiClient.get("/experiences");
      setExperiences(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void loadTrip();
    void loadExperiences();
  }, [loadTrip, loadExperiences]);

  async function removeExperience(experienceId: number) {
    try {
      await apiClient.delete(`/trips/${id}/experiences/${experienceId}`);
      loadTrip();
    } catch (err) {
      console.error("Failed to remove experience", err);
    }
  }

  async function addExperience() {
    if (!selectedExperience) return;

    try {
      await apiClient.post(`/trips/${id}/experiences`, {
        experienceId: selectedExperience,
      });

      setSelectedExperience(null);
      loadTrip();
    } catch (err) {
      console.error("Failed to add experience", err);
    }
  }

  async function deleteTrip() {
    if (!confirm("Delete this trip?")) return;

    try {
      await apiClient.delete(`/trips/${id}`);
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error("Failed to delete trip", err);
    }
  }

  if (loading) return <p className="trip-status">Loading trip...</p>;
  if (!trip) return <p className="trip-status">Trip not found.</p>;

  const isOwner = userId !== null && userId === trip.createdBy;

  return (
    <main className="trip-detail-page">
      <div className="trip-toolbar">
        <button className="trip-back" onClick={() => navigate(ClientRoutes.HOME)}>
          ← Back
        </button>

        {isOwner && (
          <div className="trip-toolbar-actions">
            <button
              className="trip-action-btn"
              onClick={() =>
                navigate(
                  ClientRoutes.TRIP_UPDATE.replace(":id", String(trip.id))
                )
              }
            >
              Update Trip
            </button>

            <button className="trip-action-btn trip-action-btn--danger" onClick={deleteTrip}>
              Delete Trip
            </button>
          </div>
        )}
      </div>

      <article className="trip-card">
        <div className="trip-title-group">
          <h1>{trip.title}</h1>
          {trip.description ? <p className="trip-description">{trip.description}</p> : null}
          <div className="trip-meta-grid">
            {trip.startDate ? (
              <p className="trip-meta"><strong>Start:</strong> {new Date(trip.startDate).toLocaleDateString()}</p>
            ) : null}
            {trip.endDate ? (
              <p className="trip-meta"><strong>End:</strong> {new Date(trip.endDate).toLocaleDateString()}</p>
            ) : null}
            <p className="trip-meta"><strong>Created:</strong> {new Date(trip.dateCreated).toLocaleDateString()}</p>
            <p className="trip-meta"><strong>Last Updated:</strong> {new Date(trip.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>

        <section className="trip-section">
          <h2 className="trip-section-title">Experiences in this Trip</h2>

          {trip.experiences.length === 0 ? (
            <p className="trip-empty">No experiences added yet.</p>
          ) : (
            <div className="trip-experience-grid">
              {trip.experiences.map((tripExperience) => {
                const exp = tripExperience.experience;
                return (
                  <article
                    key={exp.id}
                    className="trip-experience-card"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(
                        ClientRoutes.EXPERIENCE_DETAILS.replace(
                          ":id",
                          String(exp.id)
                        )
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(
                          ClientRoutes.EXPERIENCE_DETAILS.replace(
                            ":id",
                            String(exp.id)
                          )
                        );
                      }
                    }}
                  >
                    <div className="trip-experience-card__image-wrap">
                      <img
                        src={exp.thumbnail?.trim() ? exp.thumbnail : NO_IMAGE_PLACEHOLDER}
                        alt={exp.title}
                      />
                    </div>
                    <div className="trip-experience-card__body">
                      <h3>{exp.title}</h3>
                      <p className="trip-experience-card__location">
                        {exp.city ? `${exp.city}, ` : ""}
                        {exp.country || "Global"}
                      </p>
                      {exp.description ? (
                        <p className="trip-experience-card__desc">
                          {exp.description.length > 150
                            ? `${exp.description.substring(0, 150)}...`
                            : exp.description}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="trip-experience-card__view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            ClientRoutes.EXPERIENCE_DETAILS.replace(
                              ":id",
                              String(exp.id)
                            )
                          );
                        }}
                      >
                        View Experience
                      </button>
                    </div>

                    {isOwner && (
                      <div className="trip-experience-card__actions">
                        <button
                          type="button"
                          className="trip-experience-card__remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeExperience(exp.id);
                          }}
                        >
                          Remove from Trip
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isOwner && (
          <section className="trip-section">
            <h2 className="trip-section-title">Add Experience</h2>
            <div className="trip-add-experience-row">
              <label className="trip-select-wrap">
                <span>Select Experience</span>
                <select
                  value={selectedExperience ?? ""}
                  onChange={(e) =>
                    setSelectedExperience(Number(e.target.value))
                  }
                >
                  <option value="">Select an experience</option>

                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title}
                    </option>
                  ))}
                </select>
              </label>

              <button className="trip-add-btn" onClick={addExperience}>
                Add to Trip
              </button>
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
