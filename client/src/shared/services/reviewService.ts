import { apiClient } from "./api.service";

type ReviewId = string | number;

export type CreateReviewInput = {
  experienceId: ReviewId;
  rating: number;
  comment: string;
  images?: File[];
};

function buildCreateReviewFormData(input: CreateReviewInput): FormData {
  const formData = new FormData();

  formData.append("experienceId", String(input.experienceId));
  formData.append("rating", String(input.rating));
  formData.append("comment", input.comment);

  for (const image of input.images ?? []) {
    formData.append("images", image);
  }

  return formData;
}

export async function getReviews(experienceId: ReviewId) {
  const response = await apiClient.get(`/experiences/${experienceId}/reviews`);
  return response.data;
}

export async function createReview(input: CreateReviewInput) {
  const formData = buildCreateReviewFormData(input);
  const response = await apiClient.post(
    `/experiences/${input.experienceId}/reviews`,
    formData,
    {},
  );
  return response.data;
}

export async function deleteReview(experienceId: ReviewId, reviewId: ReviewId) {
  await apiClient.delete(`/experiences/${experienceId}/reviews/${reviewId}`);
}
