import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../shared/services/api.service";
import { createReview } from "../../../shared/services/reviewService";
import ReviewList from "./ReviewList";
import type { Review } from "../types/review";
import { useAuth } from "../../auth/hooks/useAuth";

type ReviewsProps = {
  experienceId: string;
  isOwner: boolean;
};

export type ReviewSortOption = "recent" | "highest" | "lowest" | "media";

export default function ReviewsSection({
  experienceId,
  isOwner,
}: ReviewsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const [sortBy, setSortBy] = useState<ReviewSortOption>("recent");

  const hasReviewed = reviews.some(
    (review) => String(review.userId) === String(user?.id),
  );

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        `/experiences/${experienceId}/reviews?sort=${sortBy}`,
      );
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [experienceId, sortBy]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createReview({
        experienceId,
        comment: newComment.trim(),
        rating: newRating,
      });

      void fetchReviews();

      setNewComment("");
      setNewRating(5);
    } catch (err) {
      alert("Only authenticated users can post reviews.");
      console.error(err);
    }
  };

  return (
    <section
      style={{
        marginTop: "40px",
        borderTop: "1px solid #eee",
        paddingTop: "20px",
      }}
    >
      <div
        className="detail-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
          Reviews ({reviews.length})
        </h2>

        <div className="sort-controls" style={{ marginBottom: "20px" }}>
          <label
            htmlFor="review-sort"
            style={{
              marginRight: "8px",
              fontWeight: "bold",
              fontSize: "0.9rem",
            }}
          >
            Sort by:{" "}
          </label>
          <select
            id="review-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
            style={{
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "white",
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="media">With Media</option>
          </select>
        </div>
      </div>

      {isOwner ? (
        <p style={{ marginBottom: "32px", fontWeight: "bold", color: "#666" }}>
          You cannot review your own experience
        </p>
      ) : hasReviewed ? (
        <p style={{ marginBottom: "32px", fontWeight: "bold", color: "#666" }}>
          You've already reviewed this experience
        </p>
      ) : (
        <>
          <button
            onClick={() =>
              navigate(`/experiences/${experienceId}/reviews/create`)
            }
            style={{
              padding: "10px 20px",
              marginBottom: "32px",
              cursor: "pointer",
              backgroundColor: "#1a73e8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              display: "block",
            }}
          >
            + Write a Detailed Review
          </button>

          <form
            onSubmit={handleSubmitReview}
            style={{
              marginBottom: "40px",
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <h4 style={{ margin: "0 0 15px 0" }}>Quick Review</h4>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ marginRight: "10px" }}>Rating: </label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                style={{ padding: "4px" }}
              >
                {[5, 4, 3, 2, 1].map((num) => (
                  <option key={num} value={num}>
                    {num} Stars
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Share your thoughts on this experience..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                width: "100%",
                height: "80px",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
                marginBottom: "12px",
                display: "block",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#34a853",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Post Review
            </button>
          </form>
        </>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>Updating reviews...</p>
        </div>
      ) : (
        <ReviewList reviews={reviews} onChange={fetchReviews} />
      )}
    </section>
  );
}
