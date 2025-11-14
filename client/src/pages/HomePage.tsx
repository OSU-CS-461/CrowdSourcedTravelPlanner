import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../services/api.service";
import { ClientRoutes } from "../utils/clientRoutes";

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
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    apiClient
      .get("/experiences")
      .then((res) => setExperiences(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <main>
      <h1>Welcome to CrowdSourced Travel Planner</h1>
      <p>This will become the authenticated landing experience.</p>

      <button
        onClick={() => navigate(ClientRoutes.EXPERIENCE_CREATE)}
        style={{
          padding: "8px 16px",
          marginTop: "16px",
          marginBottom: "16px",
          cursor: "pointer",
        }}
      >
        Create Experience
      </button>

      {experiences.length === 0 ? (
        <p>No experiences found.</p>
      ) : (
        <pre>{JSON.stringify(experiences, null, 2)}</pre>
      )}
    </main>
  );
}

export default HomePage;
