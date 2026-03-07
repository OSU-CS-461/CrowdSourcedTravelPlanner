import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import TripFormTemplate, { type TripFormValues } from "../components/TripForm";
import { setAuthToken } from "../../../shared/services/api.service";
import { apiClient } from "../../../shared/services/api.service";

export default function CreateTripPage() {
  const navigate = useNavigate();

  const handleCreateTrip = async (values: TripFormValues) => {
    const token = localStorage.getItem("cstp.auth.token");

    if (!token) {
      alert("You must be logged in to create trips.");
      return;
    }

    setAuthToken(token);

    try {
      await apiClient.post("/trips", values);
      alert("Trip created successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      alert("There was a problem creating the trip.");
    }
  };

  return (
    <main className="trip-detail-page">

      <div className="trip-toolbar">
        <button
          className="trip-back"
          onClick={() => navigate(ClientRoutes.HOME)}
        >
          ← Back
        </button>
      </div>

=      <div className="trip-card">
        <div className="trip-title-group">
          <h1>Create Trip</h1>
        </div>

        <p className="trip-description">
          Create a new trip and start adding experiences.
        </p>

        <TripFormTemplate
          onSubmit={handleCreateTrip}
          submitLabel="Create Trip"
        />
      </div>

    </main>
  );
}