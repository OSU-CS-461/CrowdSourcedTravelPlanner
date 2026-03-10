import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import { apiClient, setAuthToken } from "../../../shared/services/api.service";
import StarRating from "../common/StarRating";

export default function CreateReviewPage() {
  const navigate = useNavigate();
  const { id: experienceId } = useParams<{ id: string }>();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(`/experiences/${experienceId}/reviews`, {
        rating,
        comment: comment.trim(),
      });

      console.log("Review created:", response.data);
      alert("Review posted successfully!");
      
      navigate(ClientRoutes.EXPERIENCE_DETAILS.replace(":id", experienceId));
    } catch (err) {
      console.error("Error creating review:", err);
      const errorObj = err as { response?: { data?: { error?: string; details?: { message?: string } } } };
      const errorMessage = errorObj.response?.data?.error || 
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
          border: "1px solid #eee" 
        }}
      >
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
              fontFamily: "inherit"
            }}
          />
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
              flex: 1
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
              fontWeight: "bold"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
