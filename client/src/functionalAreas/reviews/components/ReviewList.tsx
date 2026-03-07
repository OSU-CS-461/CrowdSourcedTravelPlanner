import ReviewItem from "./ReviewItem";

export default function ReviewList({ reviews, onChange }) {
  if (!reviews.length) {
    return <p>No reviews yet. Be the first!</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onChange={onChange}
        />
      ))}
    </div>
  );
}