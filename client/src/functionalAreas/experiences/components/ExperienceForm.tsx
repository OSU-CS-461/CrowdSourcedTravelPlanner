import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationSection from "./LocationSection";
import type { LocationFields } from "./LocationSection";
import TagSelection from "./TagSelection";
import "./ExperienceForm.css";
import { type FormValues, type FormTemplateProps } from "../types/types";


function buildInitialLocation(values: Partial<FormValues>): LocationFields {
  return {
    country: values.country ?? "",
    adminRegion: values.adminRegion ?? "",
    city: values.city ?? "",
    street: values.street ?? "",
    postalCode: values.postalCode ?? "",
    latitude: values.latitude ?? "",
    longitude: values.longitude ?? "",
  };
}

export default function ExperienceForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  showTagSelector = true,
  availableCategories = [],
  availableFeatures = [],
  tagsLoading = false,
  featuresLoading = false,
  tagsError = null,
  onCategoryChange,
}: FormTemplateProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [error, setError] = useState("");

  const [image, setImage] = useState(initialValues.image ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(
    initialValues.categoryId ?? null
  );
  const [tagIds, setTagIds] = useState<number[]>(initialValues.tagIds ?? []);
  const [location, setLocation] = useState<LocationFields>(() =>
    buildInitialLocation(initialValues)
  );

  const handleLocationChange = useCallback((nextLocation: LocationFields) => {
    setLocation(nextLocation);
  }, []);

  const handleTagIdsChange = useCallback((nextTagIds: number[]) => {
    setTagIds(nextTagIds);
  }, []);

  const handleCategoryChange = useCallback(
    (nextCategoryId: number | null) => {
      setCategoryId(nextCategoryId);
      void onCategoryChange?.(nextCategoryId);
    },
    [onCategoryChange]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (categoryId === null) {
      setError("Please select a category.");
      return;
    }

    const payload: FormValues = {
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      categoryId,
      tagIds,
      country: location.country.trim().toUpperCase().slice(0, 2),
      adminRegion: location.adminRegion.trim(),
      city: location.city.trim(),
      street: location.street.trim(),
      postalCode: location.postalCode.trim(),
      latitude: location.latitude.trim(),
      longitude: location.longitude.trim(),
    };

    try {
      await onSubmit(payload);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving. Please try again.");
    }
  }

  return (
    <form className="exp-form" onSubmit={handleSubmit}>
      <h2 className="exp-form-title">Experience Details</h2>

      {error && <p className="exp-form-error">{error}</p>}

      <label className="exp-form-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label className="exp-form-field">
        <span>Description</span>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <LocationSection
        initialValue={buildInitialLocation(initialValues)}
        onChange={handleLocationChange}
      />

      <label className="exp-form-field">
        <span>Image URL</span>
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </label>

      {image && (
        <div className="exp-form-preview">
          <p>Image preview</p>
          <img src={image} alt="Preview" />
        </div>
      )}

      {showTagSelector && (
        <TagSelection
          initialCategoryId={initialValues.categoryId ?? null}
          initialTagIds={initialValues.tagIds ?? []}
          availableCategories={availableCategories}
          availableFeatures={availableFeatures}
          tagsLoading={tagsLoading}
          featuresLoading={featuresLoading}
          tagsError={tagsError}
          onCategoryChange={handleCategoryChange}
          onTagIdsChange={handleTagIdsChange}
        />
      )}

      <div className="exp-form-actions">
        <button type="button" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
