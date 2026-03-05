import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { useAuth } from "../../auth/hooks/useAuth";
import { USER_STORAGE_KEY } from "../../auth/context/auth-context";
import ExperienceList from "../components/ExperienceList"; // adjust path if needed

type ExperienceTag = {
  id: number;
  label: string;
  slug: string;
  type?: "CATEGORY" | "FEATURE";
  categoryId?: number | null;
  parentCategoryId?: number | null;
};

type ExperienceCategory = {
  id: number;
  label: string;
  slug: string;
};

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  createdByUsername?: string | null;
  thumbnail?: string;
  country?: string;
  city?: string;
  adminRegion?: string;
  category?: ExperienceCategory | null;
  tags?: ExperienceTag[];
  categoryTags?: ExperienceTag[];
  featureTags?: ExperienceTag[];
  createdBy?: number | string;
};

export default function MyExperiencesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [deletingExperienceId, setDeletingExperienceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const currentUserId = useMemo(() => {
    if (user?.id !== undefined && user?.id !== null) return user.id;

    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: string | number };
      return parsed.id ?? null;
    } catch {
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    if (currentUserId === null) {
      setExperiences([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/experiences", {
          params: { createdBy: currentUserId },
        });
        if (!cancelled) setExperiences(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setExperiences([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  async function handleDelete(experienceId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this experience? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingExperienceId(experienceId);
    try {
      await apiClient.delete(`/experiences/${experienceId}`);
      setExperiences((prev) => prev.filter((exp) => exp.id !== experienceId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete experience.");
    } finally {
      setDeletingExperienceId(null);
    }
  }

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", textAlign: "left" }}>
      <h1>My Experiences</h1>
      <p>Experiences you created.</p>

      <button onClick={() => navigate(ClientRoutes.EXPERIENCE_CREATE)}>
        + Create New Experience
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ExperienceList
          experiences={experiences}
          emptyMessage="You haven't created any experiences yet."
          onExperienceClick={(id) =>
            navigate(ClientRoutes.EXPERIENCE_DETAILS.replace(":id", String(id)), {
              state: { experience: experiences.find((e) => e.id === id) },
            })
          }
          editButtons
          deletingId={deletingExperienceId}
          onEditClick={(id) => navigate(ClientRoutes.EXPERIENCE_UPDATE.replace(":id", String(id)))}
          onDeleteClick={(id) => void handleDelete(id)}
        />
      )}
    </main>
  );
}