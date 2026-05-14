import path from "node:path";

export type MediaTypeValue = "IMAGE" | "VIDEO";

export const MAX_MEDIA_FILES = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".heic",
  ".heif",
  ".avif",
  ".tif",
  ".tiff",
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const VIDEO_MIME_TO_EXTENSIONS: Record<string, Set<string>> = {
  "video/mp4": new Set([".mp4", ".m4v"]),
  "video/webm": new Set([".webm"]),
  "video/quicktime": new Set([".mov", ".qt"]),
};

type AppError = {
  status: number;
  message: string;
};

function badRequest(message: string): AppError {
  return { status: 400, message };
}

function fileExtension(filename: string): string {
  return path.extname(filename ?? "").toLowerCase();
}

function isImageMimeType(mimeType: string) {
  return mimeType.toLowerCase().startsWith("image/");
}

export function validateUploadFilesCount(files: Express.Multer.File[]) {
  if (files.length > MAX_MEDIA_FILES) {
    throw badRequest(`You can upload up to ${MAX_MEDIA_FILES} files.`);
  }
}

export function validateAndResolveMediaType(file: Express.Multer.File): MediaTypeValue {
  const mimeType = (file.mimetype ?? "").toLowerCase();
  const extension = fileExtension(file.originalname);

  if (isImageMimeType(mimeType)) {
    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      throw badRequest(
        `Unsupported image file extension for "${file.originalname}".`,
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw badRequest(
        `Image "${file.originalname}" exceeds the ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB limit.`,
      );
    }
    return "IMAGE";
  }

  if (!ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
    throw badRequest(
      `Unsupported file type for "${file.originalname}". Allowed video types: mp4, webm, mov.`,
    );
  }

  const allowedVideoExtensions = VIDEO_MIME_TO_EXTENSIONS[mimeType];
  if (!allowedVideoExtensions?.has(extension)) {
    throw badRequest(
      `Unsupported video file extension for "${file.originalname}".`,
    );
  }

  if (file.size > MAX_VIDEO_BYTES) {
    throw badRequest(
      `Video "${file.originalname}" exceeds the ${Math.floor(MAX_VIDEO_BYTES / (1024 * 1024))} MB limit.`,
    );
  }

  return "VIDEO";
}
