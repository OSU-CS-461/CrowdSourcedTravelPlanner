import { useNavigate } from "react-router-dom";
import { deleteReview } from "../../../shared/services/reviewService";
import type { Review } from "../types/review";

type ReviewItemProps = {
  review: Review;
  onChange: () => void;
};

export default function ReviewItem({ review, onChange }: ReviewItemProps) {
  const navigate = useNavigate();
  
  const handleEdit = () => {
    const url = `/experiences/${review.experienceId}/reviews/${review.id}/update`;
    console.log("Navigating to:", url);
    navigate(url);
  };
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        // Pass BOTH the parent experience ID and the specific review ID
        await deleteReview(review.experienceId, review.id); 
        
        onChange(); // Trigger the list refresh
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="review-card" style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {/* USERNAME & DATE */}
          <div style={{ fontWeight: "bold", color: "#1a73e8" }}>{review.userName || "Anonymous"}</div>
          <div style={{ fontSize: "0.8rem", color: "#777", marginBottom: "8px" }}>
            {new Date(review.createdAt).toLocaleDateString()}
          </div>
          
          <div className="star-rating">{"★".repeat(review.rating)}</div>
          <p className="review-text" style={{ marginTop: "8px" }}>{review.comment}</p>
        </div>

        {/* EDIT & DELETE BUTTONS */}
        <div className="review-actions">
          <button onClick={handleEdit} style={{ marginRight: "8px", cursor: "pointer" }}>Edit</button>
          <button onClick={handleDelete} style={{ color: "red", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
