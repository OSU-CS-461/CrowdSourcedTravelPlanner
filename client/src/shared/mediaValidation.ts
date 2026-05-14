export type ClientMediaType = "image" | "video";

export const MAX_MEDIA_FILES = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function getFileType(file: File): ClientMediaType | null {
  if (file.type.startsWith("image/")) return "image";
  if (ALLOWED_VIDEO_MIME_TYPES.has(file.type)) return "video";
  return null;
}

function formatMb(bytes: number) {
  return Math.floor(bytes / (1024 * 1024));
}

export function validateSelectedMedia(files: File[]) {
  const errors: string[] = [];

  if (files.length > MAX_MEDIA_FILES) {
    errors.push(`You can upload up to ${MAX_MEDIA_FILES} files.`);
  }

  for (const file of files) {
    const type = getFileType(file);
    if (!type) {
      errors.push(
        `Unsupported file type for "${file.name}". Use images, mp4, webm, or mov files.`,
      );
      continue;
    }

    if (type === "image" && file.size > MAX_IMAGE_BYTES) {
      errors.push(
        `Image "${file.name}" exceeds the ${formatMb(MAX_IMAGE_BYTES)} MB limit.`,
      );
    }

    if (type === "video" && file.size > MAX_VIDEO_BYTES) {
      errors.push(
        `Video "${file.name}" exceeds the ${formatMb(MAX_VIDEO_BYTES)} MB limit.`,
      );
    }
  }

  return errors;
}

export function resolveClientMediaType(file: File): ClientMediaType | null {
  return getFileType(file);
}
