import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import "./MyTripsPage.css";

type Trip = {
  id: number;
  title: string;
  description?: string;
  dateCreated: string;
};

export default function MyTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    apiClient
      .get("/trips/me")
      .then((res) => setTrips(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <main className="my-trips-page">
      <header className="my-trips-header">
        <p className="my-trips-header__eyebrow">Trip Planning</p>
        <h1>My Trips</h1>
        <p>Trips you created and can continue building.</p>
      </header>

      <div className="my-trips-actions">
        <button
          className="my-trips-create-btn"
          onClick={() => navigate(ClientRoutes.TRIP_CREATE)}
        >
          + Create New Trip
        </button>
      </div>

      <h2 className="my-trips-section-title">Your Trips</h2>

      {trips.length === 0 ? (
        <p className="my-trips-empty">You haven't created any trips yet.</p>
      ) : (
        <div className="my-trips-grid">
          {trips.map((trip) => (
            <article key={trip.id} className="my-trip-card">
              <h2
                className="my-trip-card__title"
                onClick={() =>
                  navigate(
                    ClientRoutes.TRIP_DETAILS.replace(
                      ":id",
                      trip.id.toString()
                    )
                  )
                }
              >
                {trip.title}
              </h2>

              <div className="my-trip-card__meta">
                {new Date(trip.dateCreated).toLocaleDateString()}
              </div>

              <p className="my-trip-card__description">
                {trip.description || "Plan your next adventure."}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
