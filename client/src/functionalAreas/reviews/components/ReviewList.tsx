import ReviewItem from "./ReviewItem";
import type { Review } from "../types/review";

type ReviewListProps = {
  reviews: Review[];
  onChange: () => void;
};

export default function ReviewList({ reviews, onChange }: ReviewListProps) {
  if (!reviews.length) {
    return <p>No reviews yet. Be the first!</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review: Review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
