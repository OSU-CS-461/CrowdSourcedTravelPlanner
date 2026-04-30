import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import {
  getMyLikedTags,
  setAuthToken,
} from "../../../shared/services/api.service";
import ExperienceForm from "../components/ExperienceForm";
import type { FormValues, TagOption } from "../types/types";
import useCategories from "../hooks/useCategories";
import useCategoryFeatures from "../hooks/useCategoryFeatures";
import { createExperience } from "../experienceService";

export default function CreateExperiencePage() {
  const navigate = useNavigate();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [likedTags, setLikedTags] = useState<TagOption[]>([]);
  const { categories, loading: tagsLoading, error: tagsError } = useCategories();
  const { features, loading: featuresLoading, error: featuresError } = useCategoryFeatures(selectedCategoryId);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) return;
    setAuthToken(token);
    let cancelled = false;
    void (async () => {
      try {
        const rows = await getMyLikedTags();
        if (cancelled) return;
        setLikedTags(
          rows.map((t) => ({
            id: t.id,
            slug: t.slug,
            label: t.label,
            categoryId: t.categoryId,
          }))
        );
      } catch {
        if (!cancelled) setLikedTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  
  const handleCreateExperience = async (values: FormValues) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const {
    categories,
    loading: tagsLoading,
    error: tagsError,
  } = useCategories();
  const {
    features,
    loading: featuresLoading,
    error: featuresError,
  } = useCategoryFeatures(selectedCategoryId);

  const handleCreateExperience = async (formData: FormData) => {
    try {
      await createExperience(formData);

      navigate(ClientRoutes.HOME);
    } catch (err) {
      const maybeAxios = err as {
        response?: { data?: { error?: string; details?: unknown } };
      };
      const serverError = maybeAxios.response?.data?.error;
      const serverDetails = maybeAxios.response?.data?.details;
      const detailsText = Array.isArray(serverDetails)
        ? serverDetails
            .map((d) =>
              typeof d === "object" && d !== null
                ? `${String((d as { path?: unknown }).path ?? "")}: ${String((d as { message?: unknown }).message ?? "")}`
                : String(d),
            )
            .join("; ")
        : undefined;

      alert(
        "Error creating experience: " +
          (serverError ??
            (err instanceof Error ? err.message : "Unknown error")) +
          (detailsText ? ` (${detailsText})` : ""),
      );
    }
  };

  return (
    <div>
      <h1>Create Experience</h1>
      <ExperienceForm
        onSubmit={handleCreateExperience}
        availableCategories={categories}
        availableFeatures={features}
        submitLabel="Create"
        tagsLoading={tagsLoading}
        featuresLoading={featuresLoading}
        tagsError={tagsError || featuresError}
        onCategoryChange={setSelectedCategoryId}
        likedTags={likedTags}
      />
    </div>
  );
}
