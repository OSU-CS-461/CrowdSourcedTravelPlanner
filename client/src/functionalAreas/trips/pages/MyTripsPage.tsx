import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";

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
    <main className="page-container">
      <h1>My Trips</h1>
      <p>Trips you created.</p>

      <div className="button-group">
        <button
          className="btn btn-trip"
          onClick={() => navigate(ClientRoutes.TRIP_CREATE)}
        >
          + Create New Trip
        </button>
      </div>

      <h2 className="section-title">Your Trips</h2>

      {trips.length === 0 ? (
        <p>You haven't created any trips yet.</p>
      ) : (
        <div>
          {trips.map((trip) => (
            <div key={trip.id} className="card">
              <h2
                className="card-title"
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