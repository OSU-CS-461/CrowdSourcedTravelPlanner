import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";

type Experience = {
  id: number;
  title: string;
  description?: string;
  city?: string;
  country?: string;
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

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<number | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const userId = Number(localStorage.getItem("cstp.auth.userId"));

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

  if (loading) return <p>Loading trip...</p>;
  if (!trip) return <p>Trip not found.</p>;

  const isOwner = userId === trip.createdBy;

  return (
    <main className="exp-form">

      <div className="exp-form-actions">
        <button onClick={() => navigate(ClientRoutes.HOME)}>← Back</button>

        {isOwner && (
          <>
            <button
              onClick={() =>
                navigate(
                  ClientRoutes.TRIP_UPDATE.replace(":id", String(trip.id))
                )
              }
            >
              Update Trip
            </button>

            <button onClick={deleteTrip}>Delete Trip</button>
          </>
        )}
      </div>

      <h1 className="exp-form-title">{trip.title}</h1>

      <section className="exp-form-section">

        {trip.description && (
          <p>{trip.description}</p>
        )}

        {trip.startDate && (
          <p>
            <strong>Start:</strong>{" "}
            {new Date(trip.startDate).toLocaleDateString()}
          </p>
        )}

        {trip.endDate && (
          <p>
            <strong>End:</strong>{" "}
            {new Date(trip.endDate).toLocaleDateString()}
          </p>
        )}

        <p className="exp-form-helper">
          Created: {new Date(trip.dateCreated).toLocaleDateString()}
        </p>

        <p className="exp-form-helper">
          Last Updated: {new Date(trip.lastUpdated).toLocaleDateString()}
        </p>

      </section>

      <section className="exp-form-section">

        <h2 className="exp-form-section-title">Experiences in this Trip</h2>

        {trip.experiences.length === 0 ? (
          <p>No experiences added yet.</p>
        ) : (
          <div className="exp-form-grid">
            {trip.experiences.map((exp) => (
              <div key={exp.experience.id} className="exp-form-preview">

                <h3>{exp.experience.title}</h3>

                <p>
                  {exp.experience.city ? `${exp.experience.city}, ` : ""}
                  {exp.experience.country || ""}
                </p>

                {exp.experience.description && (
                  <p>
                    {exp.experience.description.length > 150
                      ? exp.experience.description.substring(0, 150) + "..."
                      : exp.experience.description}
                  </p>
                )}

                {isOwner && (
                  <button
                    onClick={() => removeExperience(exp.experience.id)}
                  >
                    Remove from Trip
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </section>

      {isOwner && (
        <section className="exp-form-section">

          <h2 className="exp-form-section-title">Add Experience</h2>

          <div className="exp-form-inline-group">

            <label className="exp-form-field">
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

            <button onClick={addExperience}>
              Add to Trip
            </button>

          </div>

        </section>
      )}

    </main>
  );
}
