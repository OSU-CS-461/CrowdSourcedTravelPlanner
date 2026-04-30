import crypto from "crypto";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildExperienceImageKey(
  experienceId: number,
  filename: string,
) {
  return `experiences/${experienceId}/images/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

export function buildReviewImageKey(
  experienceId: number,
  reviewId: number,
  filename: string,
) {
  return `experiences/${experienceId}/reviews/${reviewId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}
