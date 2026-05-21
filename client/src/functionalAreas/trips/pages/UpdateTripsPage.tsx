import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import TripFormTemplate, {type TripFormValues,} from "../components/TripForm";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import "./UpdateTripsPage.css";

type ApiTrip = {
  id: number | string;
  title: string | null;
  description: string | null;
};

export default function UpdateTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] =
    useState<TripFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function mapApiToTripFormValues(api: ApiTrip): TripFormValues {
    return {
      title: api.title ?? "",
      description: api.description ?? "",
    };
  }

  useEffect(() => {
    if (!id) {
      setLoadError("No trip ID provided in the URL.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      navigate(ClientRoutes.LOGIN);
      return;
    }

    setAuthToken(token);

    async function fetchTrip() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await apiClient.get(`/trips/${id}`);
        const mapped = mapApiToTripFormValues(res.data);
        setInitialValues(mapped);
      } catch (err) {
        console.error(err);
        setLoadError("There was a problem loading this trip.");
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [id, navigate]);

  const handleUpdateTrip = async (values: TripFormValues) => {
    if (!id) {
      alert("Missing trip ID in URL.");
      return;
    }

    try {
      await apiClient.put(`/trips/${id}`, {
        title: values.title,
        description: values.description,
      });

      alert("Trip updated successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      alert("There was a problem updating the trip.");
    }
  };

  if (loading) {
    return (
      <main className="update-trip-page">
        <p className="update-trip-status">Loading trip...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="update-trip-page">
        <p className="update-trip-status update-trip-status--error">{loadError}</p>
      </main>
    );
  }

  if (!initialValues) {
    return (
      <main className="update-trip-page">
        <p className="update-trip-status update-trip-status--error">Could not load trip data.</p>
      </main>
    );
  }

  return (
    <main className="update-trip-page">
      <header className="update-trip-header">
        <p className="update-trip-header__eyebrow">Trip Planning</p>
        <h1>Edit Trip</h1>
        <p className="update-trip-header__subtitle">
          Update your trip details and keep your itinerary current.
        </p>
      </header>

      <section className="update-trip-form-shell">
        <TripFormTemplate
          initialValues={initialValues}
          onSubmit={handleUpdateTrip}
          submitLabel="Update Trip"
        />
      </section>
    </main>
  );
}
