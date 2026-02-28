import { useEffect, useState } from "react";
import { apiClient } from "../../../shared/services/api.service";

// Define the Review type based on your project requirements
type Review = {
  id: string;
  experienceId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewsProps = {
  experienceId: string;
  isOwner: boolean;
};

export default function ReviewsSection({ experienceId, isOwner }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [experienceId]);

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get(`/experiences/${experienceId}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await apiClient.post(`/experiences/${experienceId}/reviews`, {
        comment: newComment,
        rating: newRating,
      });
      
      setReviews([res.data, ...reviews]);
      setNewComment("");
    } catch (err) {
      alert("Only authenticated users can post reviews.");
      console.error(err);
    }
  };

  return (
    <section style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Reviews ({reviews.length})</h2>

      {/* --- Add Review Form --- */}
      {!isOwner && (
        <form onSubmit={handleSubmitReview} style={{ marginBottom: "40px", backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Write a Review</h4>
          <div style={{ marginBottom: "10px" }}>
            <label>Rating: </label>
            <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Stars</option>)}
            </select>
          </div>
          <textarea
            placeholder="Share your experience..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "10px", display: "block" }}
          />
          <button type="submit" style={{ padding: "8px 16px", backgroundColor: "#1a73e8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            Post Review
          </button>
        </form>
      )}

      {/* --- Reviews List --- */}
      {isLoading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#70757a" }}>No reviews yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="reviews-container">
          {reviews.map((rev) => (
            <div key={rev.id} style={{ padding: "16px 0", borderBottom: "1px solid #f1f1f1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ color: "#202124" }}>{rev.userName || "Anonymous Traveler"}</strong>
                <span style={{ fontSize: "12px", color: "#70757a" }}>
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div style={{ color: "#f4b400", margin: "4px 0" }}>
                {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
              </div>

              <p style={{ color: "#3c4043", margin: "8px 0 0 0", lineHeight: "1.5", fontSize: "14px" }}>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}