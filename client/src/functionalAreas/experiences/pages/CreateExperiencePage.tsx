import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import ExperienceForm from "../components/ExperienceForm";
import useCategories from "../hooks/useCategories";
import useCategoryFeatures from "../hooks/useCategoryFeatures";
import { createExperience } from "../experienceService";

export default function CreateExperiencePage() {
  const navigate = useNavigate();

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
      />
    </div>
  );
}
