import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import ExperienceForm, { type FormValues } from "../components/ExperienceForm";

type ApiExperience = {
  id: number | string;
  title: string | null;
  description: string | null;
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function mapApiToFormValues(api: ApiExperience): FormValues {
    return {
      title: api.title ?? "",
      description: api.description ?? "",
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
        const token = localStorage.getItem("cstp.auth.token");
        if (token) setAuthToken(token);

        const res = await apiClient.get(`/experiences/${id}`);
        const data = res.data as ApiExperience;
        const mapped = mapApiToFormValues(data);
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
    if (token) setAuthToken(token);

    const keywordsArray = values.keywords
      ? values.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      : undefined;

    const countryCodeMap: Record<string, string> = {
      "united states": "US",
      "usa": "US",
      "us": "US",
      "united kingdom": "GB",
      "uk": "GB",
      "canada": "CA",
      "china": "CN",
      "japan": "JP",
      "australia": "AU",
      "germany": "DE",
      "france": "FR",
      "italy": "IT",
      "spain": "ES",
      "mexico": "MX",
      "brazil": "BR",
      "india": "IN",
      "south korea": "KR",
      "korea": "KR",
    };

    let countryCode = values.country?.trim().toLowerCase() || "";
    if (countryCode.length > 2) {
      countryCode = countryCodeMap[countryCode] || countryCode.substring(0, 2).toUpperCase();
    }
    if (countryCode.length !== 2) {
      alert("Country must be a 2-character ISO code (e.g., US, GB, CN).");
      return;
    }
    countryCode = countryCode.toUpperCase();

    if (values.description.trim().length < 20) {
      alert("Description must be at least 20 characters long.");
      return;
    }

    const putBody: Record<string, unknown> = {
      title: values.title.trim(),
      description: values.description.trim(),
      country: countryCode,
    };

    if (values.adminRegion?.trim()) putBody.adminRegion = values.adminRegion.trim();
    if (values.city?.trim()) putBody.city = values.city.trim();
    if (values.street?.trim()) putBody.street = values.street.trim();
    if (values.postalCode?.trim()) putBody.postalCode = values.postalCode.trim();

    if (values.latitude?.trim() && values.longitude?.trim()) {
      const lat = Number(values.latitude.trim());
      const lon = Number(values.longitude.trim());
      if (!isNaN(lat) && !isNaN(lon)) {
        putBody.latitude = lat;
        putBody.longitude = lon;
      }
    } else if (values.latitude?.trim() || values.longitude?.trim()) {
      alert("Both latitude and longitude must be provided together, or leave both empty.");
      return;
    }

    if (values.image?.trim()) putBody.thumbnail = values.image.trim();
    if (keywordsArray && keywordsArray.length > 0) putBody.keywords = keywordsArray;

    try {
      await apiClient.put(`/experiences/${id}`, putBody);
      alert("Experience updated successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      const errorObj = err as { response?: { data?: { error?: string; details?: { message?: string } } } };
      const errorMessage = errorObj.response?.data?.error ||
        errorObj.response?.data?.details?.message ||
        "There was a problem updating the experience.";
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return <p>Loading experience...</p>;
  }

  if (loadError) {
    return <p>{loadError}</p>;
  }

  if (!initialValues) {
    return <p>Could not load experience data.</p>;
  }

  return (
    <div>
      <h1>Edit Experience</h1>
      <ExperienceForm
        initialValues={initialValues}
        onSubmit={handleUpdateExperience}
        submitLabel="Update"
      />
    </div>
  );
}
