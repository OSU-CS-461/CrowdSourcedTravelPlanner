import { useEffect, useState } from "react";
import { apiClient, setAuthToken } from "../../../services/api.service";
import ExperienceList from "../../experiences/components/ExperienceList";
import ExperienceForm, { type FormValues } from "../../experiences/components/ExperienceForm";

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  thumbnail?: string;
  keywords?: string[];
  country?: string;
  city?: string;
};

function HomePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    apiClient
      .get("/experiences")
      .then((res) => setExperiences(res.data))
      .catch((err) => console.error(err));
  }, []);

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
      country: values.country || undefined,
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
      await apiClient.post("/experiences", postBody);
      const res = await apiClient.get("/experiences");
      setExperiences(res.data);
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
      alert("There was a problem creating the experience.");
    }
  };

  return (
    <main>
      <h1>Welcome to CrowdSourced Travel Planner</h1>

      <button
        onClick={() => setIsCreateOpen(true)}
        style={{
          marginBottom: "16px",
        }}
      >
        Create Experience
      </button>

      <ExperienceList
        experiences={experiences}
        leadingCard={
          isCreateOpen ? (
            <article className="experience-card">
              <div className="experience-card-header">
                <h2>Create Experience</h2>
                <button type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
              </div>
              <ExperienceForm onSubmit={handleCreateExperience} submitLabel="Create" />
            </article>
          ) : null
        }
      />
    </main>
  );
}

export default HomePage;
