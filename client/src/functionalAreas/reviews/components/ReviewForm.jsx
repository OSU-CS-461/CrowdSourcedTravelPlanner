import { useState } from "react";
import { apiClient } from "../../../shared/services/api.service"; import { useParams } from "react-router-dom";

export default function ReviewForm({ onSuccess }) {
  const { id } = useParams();
  
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/experiences/${id}/reviews`, { 
        experienceId: id,
        rating, 
        comment: text
      });
      
      setRating(0);
      setText("");
      if (onSuccess) onSuccess();
      alert("Review submitted!");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review.");
    }
  };

  return (
    <form className="review-form" onSubmit={submit} style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Write a Review</h3>
      
      <div style={{ margin: "10px 0" }}>
        <label>Rating: </label>
        <select 
          value={String(rating)} 
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            console.log("Setting rating to:", val); 
            setRating(val);
          }}
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
        style={{ 
          cursor: rating === 0 ? 'not-allowed' : 'pointer',
          backgroundColor: rating === 0 ? '#ccc' : '#1a73e8',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Submit Review
      </button>
    </form>
  );
}