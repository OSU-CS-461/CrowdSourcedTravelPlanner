import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiClient } from "../../../shared/services/api.service";
import { useParams, useNavigate } from "react-router-dom";
import { createReview } from "../../../shared/services/reviewService";

type ReviewFormProps = {
  onSuccess?: () => void;
};

type ReviewApiModel = {
  id: number | string;
  rating: number;
  comment?: string;
};

export default function ReviewForm({ onSuccess }: ReviewFormProps) {
  const { id, reviewId } = useParams<{ id: string; reviewId?: string }>();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const isEdit = Boolean(reviewId);

  const targetPath = id ? `/experiences/${id}` : "/";

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

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
          }
        } catch (err) {
          console.error("Error loading review for edit:", err);
        }
      };
      fetchReview();
    }
  }, [isEdit, id, reviewId]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) {
      alert("No experience ID found.");
      return;
    }

    try {
      if (isEdit) {
        await apiClient.put(`/experiences/${id}/reviews/${reviewId}`, {
          rating,
          comment: text,
        });
        alert("Review updated!");
      } else {
        await createReview({
          experienceId: id,
          rating,
          comment: text,
          images,
        });
        alert("Review submitted!");
      }

      setRating(0);
      setText("");
      setImages([]);

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

  return (
    <form
      className="review-form"
      onSubmit={submit}
      style={{ padding: "20px", border: "1px solid #ccc" }}
    >
      <h3>{isEdit ? "Edit Your Review" : "Write a Review"}</h3>

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

      {!isEdit && (
        <div style={{ margin: "10px 0" }}>
          <label style={{ display: "block", marginBottom: "6px" }}>
            Upload Images (Optional)
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : [];
              setImages(selected);
            }}
          />

          {imagePreviews.length > 0 && (
            <div
              style={{
                marginTop: "14px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: "12px",
              }}
            >
              {imagePreviews.map((preview) => (
                <div
                  key={`${preview.file.name}-${preview.file.lastModified}`}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#fafafa",
                  }}
                >
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
