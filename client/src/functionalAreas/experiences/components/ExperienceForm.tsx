import { useCallback, useMemo, useState } from "react";
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
  const [description, setDescription] = useState(
    initialValues.description ?? "",
  );
  const [error, setError] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(
    initialValues.categoryId ?? null,
  );
  const [tagIds, setTagIds] = useState<number[]>(initialValues.tagIds ?? []);
  const [location, setLocation] = useState<LocationFields>(() =>
    buildInitialLocation(initialValues),
  );
  const existingThumbnail = initialValues.image?.trim() ?? "";
  const existingImages = useMemo(
    () =>
      (initialValues.existingImages ?? []).filter(
        (url) => {
          const normalizedUrl = url.trim();
          return (
            normalizedUrl.length > 0 && normalizedUrl !== existingThumbnail
          );
        },
      ),
    [existingThumbnail, initialValues.existingImages],
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
    [onCategoryChange],
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

    const formData = new FormData();

    // text fields
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("categoryId", String(categoryId));

    formData.append(
      "country",
      location.country.trim().toUpperCase().slice(0, 2),
    );
    formData.append("adminRegion", location.adminRegion.trim());
    formData.append("city", location.city.trim());
    formData.append("street", location.street.trim());
    formData.append("postalCode", location.postalCode.trim());
    formData.append("latitude", location.latitude.trim());
    formData.append("longitude", location.longitude.trim());

    // tags
    tagIds.forEach((id) => formData.append("tagIds", String(id)));

    // files
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      await onSubmit(formData); // 🔥 changed
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
        <span>Upload Images</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const selected = e.target.files ? Array.from(e.target.files) : [];
            setFiles(selected);
          }}
        />
      </label>

      {existingThumbnail && (
        <div className="exp-form-preview">
          <p>Current thumbnail</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <img src={existingThumbnail} alt="current thumbnail" width={120} />
          </div>
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="exp-form-preview">
          <p>Existing photos</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {existingImages.map((url, idx) => (
              <img
                key={`${url}-${idx}`}
                src={url}
                alt={`existing photo ${idx + 1}`}
                width={120}
              />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="exp-form-preview">
          <p>New photos selected</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {files.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt="preview"
                width={120}
              />
            ))}
          </div>
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
