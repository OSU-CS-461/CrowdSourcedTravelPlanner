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

export async function createReview(data: ReviewPayload) {
  return fetch(`${API}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id: ReviewId) {
  return fetch(`${API}/reviews/${id}`, { method: "DELETE" });
}
