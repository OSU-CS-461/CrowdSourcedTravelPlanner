import { deleteReview } from "../../../shared/services/reviewService";
import StarRating from "../common/StarRating";

export default function ReviewItem({ review, onChange }) {
  const isOwner = review.isOwner;

  return (
    <div className="review-card">
      <StarRating value={review.rating} readOnly />
      <p className="review-text">{review.text}</p>

      {review.mediaUrls?.length > 0 && (
        <div className="review-media">
          {review.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="review media" />
          ))}
        </div>
      )}

      {isOwner && (
        <button
          className="danger"
          onClick={() => deleteReview(review.id).then(onChange)}
        >
          Delete
        </button>
      )}
    </div>
  );
}