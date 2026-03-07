const API = "/api";

type ReviewId = string | number;
type ReviewPayload = {
  experienceId: ReviewId;
  rating: number;
  text: string;
};

export async function getReviews(experienceId: ReviewId) {
  const res = await fetch(`${API}/experiences/${experienceId}/reviews`);
  return res.json();
}

// Fixed: Matches app.use('/api/experiences/:id/reviews', reviewRouter)
export async function createReview(data: ReviewPayload) {
  return fetch(`${API}/experiences/${data.experienceId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Fixed: Requires experienceId to navigate the nested backend route
export async function deleteReview(experienceId: ReviewId, reviewId: ReviewId) {
  return fetch(`${API}/experiences/${experienceId}/reviews/${reviewId}`, { 
    method: "DELETE" 
  });
}