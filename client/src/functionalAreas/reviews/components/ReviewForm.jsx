import { useState } from "react";
import { createReview } from "../../../services/reviewService";
import StarRating from "../common/StarRating";

export default function ReviewForm({ experienceId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await createReview({ experienceId, rating, text });
    setRating(0);
    setText("");
    onSuccess();
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <h3>Write a Review</h3>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        placeholder="Share your experience (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button disabled={rating === 0}>Submit Review</button>
    </form>
  );
}