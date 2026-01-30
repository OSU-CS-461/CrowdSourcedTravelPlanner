import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../utils/clientRoutes";
import FormTemplate, { type FormValues } from "../components/FormTemplate";
import { apiClient, setAuthToken } from "../services/api.service";

type ApiExperience = {
  id: number | string;
  title: string | null;
  description: string | null;
  dateCreated: string | null;
  thumbnail: string | null;
  keywords: string[] | string | null;

  country: string | null;
  adminRegion: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;

  latitude: number | null;
  longitude: number | null;
};

export default function UpdateExperiencePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function mapApiToFormValues(api: ApiExperience): FormValues {
    return {
      title: api.title ?? "",
      description: api.description ?? "",
      date: api.dateCreated
        ? new Date(api.dateCreated).toISOString().slice(0, 10)
        : "",
      image: api.thumbnail ?? "",
      keywords: Array.isArray(api.keywords)
        ? api.keywords.join(", ")
        : api.keywords ?? "",
      country: api.country ?? "",
      adminRegion: api.adminRegion ?? "",
      city: api.city ?? "",
      street: api.street ?? "",
      postalCode: api.postalCode ?? "",
      latitude:
        api.latitude !== null && api.latitude !== undefined
          ? String(api.latitude)
          : "",
      longitude:
        api.longitude !== null && api.longitude !== undefined
          ? String(api.longitude)
          : "",
    };
  }

  useEffect(() => {
    if (!id) {
      setLoadError("No experience ID provided in the URL.");
      setLoading(false);
      return;
    }

    async function fetchExperience() {
      try {
        setLoading(true);
        setLoadError(null);

        const res = await apiClient.get(`/experiences/${id}`);
        const mapped = mapApiToFormValues(res.data);
        setInitialValues(mapped);
      } catch (err) {
        console.error(err);
        setLoadError("There was a problem loading this experience.");
      } finally {
        setLoading(false);
      }
    }

    fetchExperience();
  }, [id]);

  const handleUpdateExperience = async (values: FormValues) => {
    if (!id) {
      alert("Missing experience ID in URL.");
      return;
    }

    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("You must be logged in.");
      return;
    }

    setAuthToken(token);

    const keywordsArray = values.keywords
      ? values.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : undefined;

    const putBody = {
      title: values.title,
      description: values.description,
      country: values.country,
      adminRegion: values.adminRegion || undefined,
      city: values.city || undefined,
      street: values.street || undefined,
      postalCode: values.postalCode || undefined,
      latitude:
        values.latitude && values.latitude.trim() !== ""
          ? Number(values.latitude)
          : undefined,
      longitude:
        values.longitude && values.longitude.trim() !== ""
          ? Number(values.longitude)
          : undefined,
      thumbnail: values.image || undefined,
      keywords: keywordsArray,
    };

    try {
      await apiClient.put(`/experiences/${id}`, putBody);
      alert("Experience updated successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      alert("There was a problem updating the experience.");
    }
  };

  if (loading) return <p>Loading experience...</p>;
  if (loadError) return <p>{loadError}</p>;
  if (!initialValues) return <p>Could not load experience data.</p>;

  return (
    <div>
      <h1>Edit Experience</h1>
      <FormTemplate
        initialValues={initialValues}
        onSubmit={handleUpdateExperience}
        submitLabel="Update"
      />
    </div>
  );
}