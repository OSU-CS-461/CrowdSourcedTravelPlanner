import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import ReviewList from "./ReviewList";

// Define the Review type based on the project requirements
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
  const navigate = useNavigate();
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
      
      // Update local state so the new review appears immediately
      setReviews(prev => [res.data, ...prev]);
      setNewComment("");
      setNewRating(5);

      // REMOVE the navigate() call if you are already on the detail page!
      // navigate(`/experiences/${experienceId}`); 

    } catch (err) {
      alert("Only authenticated users can post reviews.");
      console.error(err);
    }
  };
  
  return (
    <section style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
      <div className="detail-header">
        <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Reviews ({reviews.length})</h2>

        <button
          onClick={() => navigate(`/experiences/${experienceId}/reviews/create`)}
          style={{
            padding: "10px 20px",
            marginTop: "16px",
            marginBottom: "32px",
            cursor: "pointer",
            backgroundColor: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold"
          }}
        >
          + Create New Reviews
        </button>
      </div>

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
      ) : (
        <ReviewList 
          reviews={reviews} 
          onChange={fetchReviews} 
        />
      )}
    </section>
  );
}