import { useNavigate } from "react-router-dom";
import { deleteReview } from "../../../shared/services/reviewService";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Review } from "../types/review";

type ReviewItemProps = {
  review: Review;
  onChange: () => void;
};

type HttpError = {
  response?: {
    status?: number;
  };
};

export default function ReviewItem({ review, onChange }: ReviewItemProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwner = user && String(user.id) === String(review.userId);

  const handleEdit = () => {
    navigate(`/experiences/${review.experienceId}/reviews/${review.id}/update`);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview(review.experienceId, review.id);
        onChange();
      } catch (err: unknown) {
        const httpError = err as HttpError;
        if (httpError.response?.status === 403) {
          alert("You do not have permission to delete this review.");
        } else {
          console.error("Delete failed:", err);
        }
      }
    }
  };

  return (
    <div className="review-card" style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", color: "#1a73e8" }}>{review.userName || "Anonymous"}</div>
          <div style={{ fontSize: "0.8rem", color: "#777", marginBottom: "8px" }}>
            {new Date(review.createdAt).toLocaleDateString()}
          </div>
          
          <div className="star-rating">{"★".repeat(review.rating)}</div>
          <p className="review-text" style={{ marginTop: "8px" }}>{review.comment}</p>
          
          {/* ✅ ONLY ONE MEDIA BLOCK - Keep the robust one */}
          {review.media && review.media.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              {review.media.map((item) => (
                <div key={item.id} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" }}>
                  {item.type === 'video' ? (
                    <video 
                      src={item.url} 
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.alt || "Review media"} 
                      style={{ width: "100px", height: "100px", objectFit: "cover", display: "block" }}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwner && (
          <div className="review-actions" style={{ marginLeft: "16px" }}>
            <button onClick={handleEdit} style={{ marginRight: "8px", cursor: "pointer", padding: "4px 8px" }}>Edit</button>
            <button onClick={handleDelete} style={{ color: "red", cursor: "pointer", padding: "4px 8px" }}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
