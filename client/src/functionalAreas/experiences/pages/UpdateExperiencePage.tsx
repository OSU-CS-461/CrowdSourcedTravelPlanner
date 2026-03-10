import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExperienceForm from "../components/ExperienceForm";
import { type FormValues } from "../types/types";
import { getExperienceById, updateExperience } from "../experienceService";
import buildExpCreationPayload from "../helpers/buildExpCreationPayload";
import mapApiExperienceToFormValues from "../helpers/mapApiExperienceToFormValues";
import useCategories from "../hooks/useCategories";
import useCategoryFeatures from "../hooks/useCategoryFeatures";

export default function UpdateExperiencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const { categories, loading: tagsLoading, error: tagsError } =
    useCategories();
  const {
    features,
    loading: featuresLoading,
    error: featuresError,
  } = useCategoryFeatures(selectedCategoryId);

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoadError("No experience ID provided in the URL.");
      setLoading(false);
      return;
    }
    const experienceId = id;

    async function fetchExperience() {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await getExperienceById(experienceId);
        const mappedValues = mapApiExperienceToFormValues(res.data);
        setInitialValues(mappedValues);
        setSelectedCategoryId(mappedValues.categoryId);
      } catch (err) {
        console.error(err);
        setLoadError("There was a problem loading this experience.");
      } finally {
        setLoading(false);
      }
    }

    void fetchExperience();
  }, [id]);

  const handleUpdateExperience = async (values: FormValues) => {
    if (!id) {
      alert("Missing experience ID in URL.");
      return;
    }

    try {
      const payload = buildExpCreationPayload(values);
      await updateExperience(id, payload);

      // TODO: at some point we should navigate to the updated experience's details
      // page instead of home
      navigate(`/experiences/${id}`);
    } catch (err) {
      // TODO: at some point we'll need better error handling/UI, but this is fine for now
      alert(
        "Error updating experience: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
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
        showTagSelector
        availableCategories={categories}
        availableFeatures={features}
        tagsLoading={tagsLoading}
        featuresLoading={featuresLoading}
        tagsError={tagsError || featuresError}
        onCategoryChange={setSelectedCategoryId}
      />
    </div>
  );
}
