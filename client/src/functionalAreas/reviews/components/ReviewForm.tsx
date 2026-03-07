import { useState, useEffect } from "react"; // Added useEffect
import { apiClient } from "../../../shared/services/api.service";
import { useParams, useNavigate } from "react-router-dom";

export default function ReviewForm({ onSuccess }) {
  const { id, reviewId } = useParams();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const isEdit = Boolean(reviewId);

  // Define this at the top level so all functions can see it
  const targetPath = `/experiences/${id}`;

  useEffect(() => {
    if (isEdit) {
      const fetchReview = async () => {
        try {
          const res = await apiClient.get(`/experiences/${id}/reviews`);
          const existingReview = res.data.find(r => String(r.id) === String(reviewId));
          
          if (existingReview) {
            setRating(existingReview.rating);
            // Match the field names from your backend formatter
            setText(existingReview.comment || ""); 
          }
        } catch (err) {
          console.error("Error loading review for edit:", err);
        }
      };
      fetchReview();
    }
  }, [isEdit, id, reviewId]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await apiClient.put(`/experiences/${id}/reviews/${reviewId}`, {
          rating,
          comment: text
        });
        alert("Review updated!");
      } else {
        await apiClient.post(`/experiences/${id}/reviews`, { 
          experienceId: id,
          rating, 
          comment: text
        });
        alert("Review submitted!");
      }

      setRating(0);
      setText("");

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(targetPath); // Now accessible
      }
    } catch (err) {
      console.error("Submission Error:", err);
      alert(isEdit ? "Failed to update review." : "Failed to submit review.");
    }
  };

  return (
    <form className="review-form" onSubmit={submit} style={{ padding: '20px', border: '1px solid #ccc' }}>
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
      
      <button 
        type="submit" 
        disabled={rating === 0}
        style={{ /* your existing styles */ }}
      >
        {isEdit ? "Save Changes" : "Submit Review"}
      </button>

      {/* Cancel button now has access to targetPath */}
      {isEdit && (
        <button 
          type="button" 
          onClick={() => navigate(targetPath)}
          style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#777', cursor: 'pointer' }}
        >
          Cancel
        </button>
      )}
    </form>
  );
}