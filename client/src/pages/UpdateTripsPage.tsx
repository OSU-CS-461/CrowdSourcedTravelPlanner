import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../utils/clientRoutes";
import TripFormTemplate, {type TripFormValues,} from "../components/TripFormTemplate";
import { apiClient, setAuthToken } from "../services/api.service";

type ApiTrip = {
  id: number | string;
  title: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  visibility: "private" | "public" | "unlisted" | null;
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
      destination: api.destination ?? "",
      startDate: api.startDate
        ? api.startDate.slice(0, 10)
        : "",
      endDate: api.endDate
        ? api.endDate.slice(0, 10)
        : "",
      visibility: api.visibility ?? "private",
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
        destination: values.destination,
        startDate: values.startDate,
        endDate: values.endDate,
        visibility: values.visibility,
      });

      alert("Trip updated successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      alert("There was a problem updating the trip.");
    }
  };

  if (loading) return <p>Loading trip...</p>;
  if (loadError) return <p>{loadError}</p>;
  if (!initialValues) return <p>Could not load trip data.</p>;

  return (
    <div>
      <h1>Edit Trip</h1>
      <TripFormTemplate
        initialValues={initialValues}
        onSubmit={handleUpdateTrip}
        submitLabel="Update Trip"
      />
    </div>
  );
}