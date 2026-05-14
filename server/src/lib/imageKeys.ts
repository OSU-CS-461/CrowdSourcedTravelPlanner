import crypto from "crypto";
import type { MediaTypeValue } from "./mediaValidation";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildExperienceImageKey(
  experienceId: number,
  filename: string,
  mediaType: MediaTypeValue = "IMAGE",
) {
  const mediaFolder = mediaType === "VIDEO" ? "videos" : "images";
  return `experiences/${experienceId}/${mediaFolder}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

export function buildReviewImageKey(
  experienceId: number,
  reviewId: number,
  filename: string,
  mediaType: MediaTypeValue = "IMAGE",
) {
  const mediaFolder = mediaType === "VIDEO" ? "videos" : "images";
  return `experiences/${experienceId}/reviews/${reviewId}/${mediaFolder}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}
