import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import ExperienceForm from "../components/ExperienceForm";
import type { FormValues } from "../types/types";
import useCategories from "../hooks/useCategories";
import useCategoryFeatures from "../hooks/useCategoryFeatures";
import { createExperience } from "../experienceService";
import buildExpCreationPayload  from "../helpers/buildExpCreationPayload";

export default function CreateExperiencePage() {
  const navigate = useNavigate();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { categories, loading: tagsLoading, error: tagsError } = useCategories();
  const { features, loading: featuresLoading, error: featuresError } = useCategoryFeatures(selectedCategoryId);
  
  const handleCreateExperience = async (values: FormValues) => {
    try {
      const payload = buildExpCreationPayload(values);
      await createExperience(payload);

      // TODO: at some point we should navigate to the newly created experience's details
      // page instead of home
      navigate(ClientRoutes.HOME);
    } catch (err) {
      // TODO: at some point we'll need better error handling/UI, but this is fine for now
      alert("Error creating experience: " + (err instanceof Error ? err.message : "Unknown error"));
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
