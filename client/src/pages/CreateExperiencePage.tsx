import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../utils/clientRoutes";
import FormTemplate, { type FormValues } from "../components/FormTemplate";

export default function CreateExperiencePage() {
  const navigate = useNavigate();

  const handleCreateExperience = async (values: FormValues) => {

    // TODO: replace with real user ID from auth
    const currentUserId = 1;

    const postBody = {
      createdBy: currentUserId,
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
      keywords: values.keywords,
    };

    try {
        // TODO: replace with backend API URL
      const res = await fetch("replace-with-backendapiurl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody),
      });

      if (!res.ok) {
        throw new Error("Failed to create experience");
      }

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
