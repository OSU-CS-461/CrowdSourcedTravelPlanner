import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../utils/clientRoutes";
import FormTemplate, { type FormValues } from "../components/FormTemplate";
import { setAuthToken } from "../services/api.service";
import { apiClient } from "../services/api.service";

export default function CreateExperiencePage() {
  const navigate = useNavigate();

  const handleCreateExperience = async (values: FormValues) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("You must be logged in to create experiences.");
      return;
    }
    setAuthToken(token);

    const keywordsArray =
      values.keywords?.trim().length
        ? values.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

    const postBody = {
      title: values.title,
      description: values.description,
      country: values.country || "Unknown",
      adminRegion: values.adminRegion || "Unknown",
      city: values.city || "Unknown",
      street: values.street || "Unknown",
      postalCode: values.postalCode || "00000",
      latitude:
        values.latitude && values.latitude.trim() !== ""
          ? Number(values.latitude)
          : null,
      longitude:
        values.longitude && values.longitude.trim() !== ""
          ? Number(values.longitude)
          : null,
      thumbnail: values.image, 
      keywords: keywordsArray,
    };

    try {
      await apiClient.post("/experiences", postBody);
      alert("Experience created successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      alert("There was a problem creating the experience.");
    }
  };

  return (
    <div>
      <h1>Create Experience</h1>
      <FormTemplate onSubmit={handleCreateExperience} submitLabel="Create" />
    </div>
  );
}
