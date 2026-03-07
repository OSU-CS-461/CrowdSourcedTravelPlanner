export default function StarRating({ rating }: { rating: number }) {
  return (
    <div className="star-rating">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </div>
  );
}