import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationSection from "./LocationSection";
import type { LocationFields } from "./LocationSection";
import TagSelection from "./TagSelection";
import "./ExperienceForm.css";
import { type FormValues, type FormTemplateProps } from "../types/types";
import {
  resolveClientMediaType,
  validateSelectedMedia,
} from "../../../shared/mediaValidation";

type SelectedMediaPreview = {
  file: File;
  url: string;
  type: "image" | "video";
};

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

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  likedTags = [],
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
  const [removedMediaIds, setRemovedMediaIds] = useState<Array<number | string>>(
    [],
  );
  const existingThumbnail = initialValues.image?.trim() ?? "";
  const existingMedia = useMemo(
    () =>
      (initialValues.existingMedia ?? []).filter((item) => {
        return (
          typeof item.url === "string" &&
          item.url.trim().length > 0 &&
          !removedMediaIds.includes(item.id)
        );
      }),
    [initialValues.existingMedia, removedMediaIds],
  );

  const selectedPreviews = useMemo<SelectedMediaPreview[]>(() => {
    return files
      .map((file) => {
        const type = resolveClientMediaType(file);
        if (!type) return null;
        return {
          file,
          url: URL.createObjectURL(file),
          type,
        };
      })
      .filter((item): item is SelectedMediaPreview => item !== null);
  }, [files]);

  useEffect(() => {
    return () => {
      selectedPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedPreviews]);

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

  function toggleRemoveExistingMedia(mediaId: number | string) {
    setRemovedMediaIds((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId],
    );
  }

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

    const validationErrors = validateSelectedMedia(files);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
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

    removedMediaIds.forEach((id) =>
      formData.append("removeMediaIds", String(id)),
    );

    // files
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      await onSubmit(formData);
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
        <span>Upload Media</span>
        <input
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={(e) => {
            const selected = e.target.files ? Array.from(e.target.files) : [];
            const validationErrors = validateSelectedMedia(selected);
            if (validationErrors.length > 0) {
              setError(validationErrors[0]);
              setFiles([]);
              return;
            }

            setError("");
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

      {existingMedia.length > 0 && (
        <div className="exp-form-preview">
          <p>Existing media</p>
          <div style={{ display: "grid", gap: "10px" }}>
            {existingMedia.map((item, idx) => (
              <label
                key={`${item.id}-${idx}`}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    width={120}
                    height={80}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={`existing media ${idx + 1}`}
                    width={120}
                    height={80}
                    style={{ objectFit: "cover" }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div>{item.originalFilename ?? `Media ${idx + 1}`}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {item.mimeType ?? item.type}
                    {typeof item.fileSizeBytes === "number"
                      ? ` • ${formatFileSize(item.fileSizeBytes)}`
                      : ""}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={removedMediaIds.includes(item.id)}
                  onChange={() => toggleRemoveExistingMedia(item.id)}
                />
                <span>Remove</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedPreviews.length > 0 && (
        <div className="exp-form-preview">
          <p>New media selected</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {selectedPreviews.map((preview) => (
              <div key={`${preview.file.name}-${preview.file.lastModified}`}>
                {preview.type === "video" ? (
                  <video
                    src={preview.url}
                    width={140}
                    height={90}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    width={140}
                    height={90}
                    style={{ objectFit: "cover" }}
                  />
                )}
                <div style={{ fontSize: "12px", color: "#666", maxWidth: "140px" }}>
                  {preview.file.name}
                </div>
              </div>
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
          likedTags={likedTags}
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
