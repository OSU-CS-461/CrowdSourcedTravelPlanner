import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { setAuthToken } from "../../../shared/services/api.service";
import { createReview } from "../../../shared/services/reviewService";
import StarRating from "../common/StarRating";
import {
  resolveClientMediaType,
  validateSelectedMedia,
} from "../../../shared/mediaValidation";

type PreviewItem = {
  file: File;
  url: string;
  type: "image" | "video";
};

export default function CreateReviewPage() {
  const navigate = useNavigate();
  const { id: experienceId } = useParams<{ id: string }>();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(
    () =>
      files
        .map((file) => {
          const type = resolveClientMediaType(file);
          if (!type) return null;
          return {
            file,
            url: URL.createObjectURL(file),
            type,
          };
        })
        .filter((item): item is PreviewItem => item !== null),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("You must be logged in to post a review.");
      return;
    }
    setAuthToken(token);

    if (!experienceId) {
      alert("No experience ID found. Cannot post review.");
      return;
    }

    if (!comment.trim()) {
      alert("Please enter a comment for your review.");
      return;
    }

    const validationErrors = validateSelectedMedia(files);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createReview({
        experienceId,
        rating,
        comment: comment.trim(),
        images: files,
      });

      console.log("Review created:", response);
      alert("Review posted successfully!");

      navigate(ClientRoutes.EXPERIENCE_DETAILS.replace(":id", experienceId));
    } catch (err) {
      console.error("Error creating review:", err);
      const errorObj = err as {
        response?: { data?: { error?: string; details?: { message?: string } } };
      };
      const errorMessage =
        errorObj.response?.data?.error ||
        errorObj.response?.data?.details?.message ||
        "There was a problem posting your review.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
      <h1>Write a Review</h1>
      <p style={{ color: "#70757a", marginBottom: "24px" }}>
        Share your thoughts about this experience with others.
      </p>

      <form
        onSubmit={handleCreateReview}
        style={{
          backgroundColor: "#f8f9fa",
          padding: "24px",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        {error && <p style={{ color: "#b00020" }}>{error}</p>}

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Rating
          </label>
          <StarRating rating={rating} />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ marginTop: "8px" }}
          >
            {[5, 4, 3, 2, 1].map((num) => (
              <option key={num} value={num}>
                {num} Stars
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            Your Review
          </label>
          <textarea
            placeholder="What did you like or dislike?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            style={{
              width: "100%",
              height: "150px",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "16px",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
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

              setError(null);
              setFiles(selected);
            }}
          />
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
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1a73e8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontWeight: "bold",
              flex: 1,
            }}
          >
            {isSubmitting ? "Posting..." : "Post Review"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "12px 24px",
              backgroundColor: "white",
              color: "#3c4043",
              border: "1px solid #dadce0",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
