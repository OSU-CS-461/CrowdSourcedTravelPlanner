const API = "/api";

export async function getReviews(experienceId) {
  const res = await fetch(`${API}/experiences/${experienceId}/reviews`);
  return res.json();
}

export async function createReview(data) {
  return fetch(`${API}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id) {
  return fetch(`${API}/reviews/${id}`, { method: "DELETE" });
}