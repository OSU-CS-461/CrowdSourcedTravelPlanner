import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiClient } from "../../../shared/services/api.service";
import { useParams, useNavigate } from "react-router-dom";
import { createReview } from "../../../shared/services/reviewService";
import {
  resolveClientMediaType,
  validateSelectedMedia,
} from "../../../shared/mediaValidation";

type ReviewFormProps = {
  onSuccess?: () => void;
};

type ReviewApiModel = {
  id: number | string;
  rating: number;
  comment?: string;
  media?: Array<{
    id: string;
    url: string;
    type: "image" | "video";
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    originalFilename?: string | null;
  }>;
};

type SelectedPreview = {
  file: File;
  url: string;
  type: "image" | "video";
};

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReviewForm({ onSuccess }: ReviewFormProps) {
  const { id, reviewId } = useParams<{ id: string; reviewId?: string }>();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<
    Array<{
      id: string;
      url: string;
      type: "image" | "video";
      mimeType?: string | null;
      fileSizeBytes?: number | null;
      originalFilename?: string | null;
    }>
  >([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const isEdit = Boolean(reviewId);

  const targetPath = id ? `/experiences/${id}` : "/";

  const previews = useMemo(() => {
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
      .filter((item): item is SelectedPreview => item !== null);
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  useEffect(() => {
    if (isEdit && id) {
      const fetchReview = async () => {
        try {
          const res = await apiClient.get(`/experiences/${id}/reviews`);
          const existingReview = (res.data as ReviewApiModel[]).find(
            (r: ReviewApiModel) => String(r.id) === String(reviewId),
          );

          if (existingReview) {
            setRating(existingReview.rating);
            setText(existingReview.comment || "");
            setExistingMedia(existingReview.media ?? []);
          }
        } catch (err) {
          console.error("Error loading review for edit:", err);
        }
      };
      fetchReview();
    }
  }, [isEdit, id, reviewId]);

  function toggleRemovedMedia(mediaId: string) {
    setRemovedMediaIds((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId],
    );
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) {
      alert("No experience ID found.");
      return;
    }

    const validationErrors = validateSelectedMedia(files);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    try {
      if (isEdit) {
        const formData = new FormData();
        formData.append("rating", String(rating));
        formData.append("comment", text);

        removedMediaIds.forEach((mediaId) =>
          formData.append("removeMediaIds", mediaId),
        );

        files.forEach((file) => {
          formData.append("images", file);
        });

        await apiClient.put(`/experiences/${id}/reviews/${reviewId}`, formData, {});
        alert("Review updated!");
      } else {
        await createReview({
          experienceId: id,
          rating,
          comment: text,
          images: files,
        });
        alert("Review submitted!");
      }

      setRating(0);
      setText("");
      setFiles([]);
      setRemovedMediaIds([]);
      setError("");

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(targetPath);
      }
    } catch (err) {
      console.error("Submission Error:", err);
      alert(isEdit ? "Failed to update review." : "Failed to submit review.");
    }
  };

  const visibleExistingMedia = existingMedia.filter(
    (item) => !removedMediaIds.includes(item.id),
  );

  return (
    <form
      className="review-form"
      onSubmit={submit}
      style={{ padding: "20px", border: "1px solid #ccc" }}
    >
      <h3>{isEdit ? "Edit Your Review" : "Write a Review"}</h3>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      <div style={{ margin: "10px 0" }}>
        <label>Rating: </label>
        <select
          value={String(rating)}
          onChange={(e) => setRating(parseInt(e.target.value, 10))}
        >
          <option value="0">Select a score...</option>
          <option value="1">1 - Poor</option>
          <option value="2">2 - Fair</option>
          <option value="3">3 - Good</option>
          <option value="4">4 - Very Good</option>
          <option value="5">5 - Excellent</option>
        </select>
      </div>

      <textarea
        placeholder="Share your experience (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", margin: "10px 0", minHeight: "80px" }}
      />

      <div style={{ margin: "10px 0" }}>
        <label style={{ display: "block", marginBottom: "6px" }}>
          Upload Photos or Videos (Optional)
        </label>

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
      </div>

      {visibleExistingMedia.length > 0 && (
        <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>Existing media</p>
          {visibleExistingMedia.map((item) => (
            <label
              key={item.id}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {item.type === "video" ? (
                <video
                  src={item.url}
                  controls
                  preload="metadata"
                  style={{ width: "120px", height: "80px", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.originalFilename ?? "review media"}
                  style={{ width: "120px", height: "80px", objectFit: "cover" }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div>{item.originalFilename ?? item.type}</div>
                <div style={{ color: "#666", fontSize: "12px" }}>
                  {item.mimeType ?? item.type}
                  {typeof item.fileSizeBytes === "number"
                    ? ` • ${formatFileSize(item.fileSizeBytes)}`
                    : ""}
                </div>
              </div>
              <input
                type="checkbox"
                checked={removedMediaIds.includes(item.id)}
                onChange={() => toggleRemovedMedia(item.id)}
              />
              <span>Remove</span>
            </label>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div
          style={{
            marginTop: "14px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "12px",
          }}
        >
          {previews.map((preview) => (
            <div
              key={`${preview.file.name}-${preview.file.lastModified}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                overflow: "hidden",
                background: "#fafafa",
              }}
            >
              {preview.type === "video" ? (
                <video
                  src={preview.url}
                  controls
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  style={{
                    width: "100%",
                    height: "100px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
              <div
                style={{
                  padding: "8px",
                  fontSize: "12px",
                  color: "#666",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={preview.file.name}
              >
                {preview.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="submit" disabled={rating === 0}>
        {isEdit ? "Save Changes" : "Submit Review"}
      </button>

      {isEdit && (
        <button
          type="button"
          onClick={() => navigate(targetPath)}
          style={{
            marginLeft: "10px",
            background: "none",
            border: "none",
            color: "#777",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      )}
    </form>
  );
}
