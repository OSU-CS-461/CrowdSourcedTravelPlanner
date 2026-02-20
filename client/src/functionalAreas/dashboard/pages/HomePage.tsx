import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
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

      <h2>Your Experiences</h2>

      {experiences.length === 0 ? (
        <p>No experiences found. Start by creating one!</p>
      ) : (
        <div>
          {experiences.map((exp) => (
            <div key={exp.id} className="card">
              <h2
                className="card-title"
                onClick={() =>
                  navigate(
                    ClientRoutes.EXPERIENCE_DETAILS.replace(
                      ":id",
                      exp.id.toString()
                    ),
                    { state: { experience: exp } }
                  )
                }
              >
                {exp.title}
              </h2>

              <div className="card-meta">
                {exp.city ? `${exp.city}, ` : ""}
                {exp.adminRegion ? `${exp.adminRegion}, ` : ""}
                {exp.country || "Global"} -{" "}
                {new Date(exp.dateCreated).toLocaleDateString()}
              </div>

              <p className="card-description">
                {exp.description && exp.description.length > 160
                  ? `${exp.description.substring(0, 160)}...`
                  : exp.description ||
                    "Discover more about this hidden gem..."}
              </p>
            </div>
          ))}
        </div>
      )}

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
                    ClientRoutes.TRIP_UPDATE.replace(":id", trip.id.toString())
                  )
                }
              >
                {trip.title}
              </h2>

              <div className="card-meta">
                {new Date(trip.dateCreated).toLocaleDateString()}
              </div>

              <p className="card-description">
                {trip.description || "Plan your next adventure."}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
