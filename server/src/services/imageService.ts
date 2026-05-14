import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../db/prisma";
import { r2 } from "../lib/r2";
import { buildExperienceImageKey, buildReviewImageKey } from "../lib/imageKeys";
import {
  validateAndResolveMediaType,
  validateUploadFilesCount,
  type MediaTypeValue,
} from "../lib/mediaValidation";

type UploadReviewImagesInput = {
  createdBy: number;
  reviewId: number;
  experienceId: number;
  files: Express.Multer.File[];
};

type UploadExperienceImagesInput = {
  createdBy: number;
  experienceId: number;
  files: Express.Multer.File[];
};

type UploadedImage = {
  id: number;
  storageKey: string;
  url: string;
  mediaType: MediaTypeValue;
  mimeType: string;
  fileSizeBytes: number;
  originalFilename: string;
};

type AppError = {
  status: number;
  message: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getUploadConfigStatus() {
  return {
    hasEndpoint: isNonEmptyString(process.env.R2_ENDPOINT),
    hasAccessKeyId: isNonEmptyString(process.env.R2_ACCESS_KEY_ID),
    hasSecretAccessKey: isNonEmptyString(process.env.R2_SECRET_ACCESS_KEY),
    hasBucket: isNonEmptyString(process.env.R2_BUCKET),
    hasPublicBaseUrl: isNonEmptyString(process.env.R2_PUBLIC_BASE_URL),
  };
}

function assertUploadConfigConfigured(context: "review" | "experience") {
  const status = getUploadConfigStatus();
  const missingKeys: string[] = [];

  if (!status.hasEndpoint) missingKeys.push("R2_ENDPOINT");
  if (!status.hasAccessKeyId) missingKeys.push("R2_ACCESS_KEY_ID");
  if (!status.hasSecretAccessKey) missingKeys.push("R2_SECRET_ACCESS_KEY");
  if (!status.hasBucket) missingKeys.push("R2_BUCKET");
  if (!status.hasPublicBaseUrl) missingKeys.push("R2_PUBLIC_BASE_URL");

  console.info(`[image.upload.${context}] Upload config status`, status);

  if (missingKeys.length > 0) {
    console.error(`[image.upload.${context}] Missing upload configuration`, {
      missingKeys,
    });
    throw {
      status: 500,
      message: "Image upload service is not configured correctly.",
    } satisfies AppError;
  }
}

function normalizeUploadError(error: unknown, context: "review" | "experience") {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  const isCredentialIssue =
    normalized.includes("resolved credential object is not valid") ||
    normalized.includes("credential") ||
    normalized.includes("access key") ||
    normalized.includes("secret access key") ||
    normalized.includes("signature");

  console.error(`[image.upload.${context}] Upload failed`, {
    errorType:
      error instanceof Error
        ? error.name
        : typeof error === "object"
          ? "object"
          : typeof error,
    errorMessage: message,
  });

  if (isCredentialIssue) {
    return {
      status: 500,
      message: "Image upload service is not configured correctly.",
    } satisfies AppError;
  }

  return error;
}

async function deleteUploadedObjects(keys: string[]) {
  if (!keys.length) return;

  await Promise.allSettled(
    keys.map((key) =>
      r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
        }),
      ),
    ),
  );
}

export async function uploadReviewImages(
  input: UploadReviewImagesInput,
): Promise<UploadedImage[]> {
  assertUploadConfigConfigured("review");
  validateUploadFilesCount(input.files);

  const uploadedKeys: string[] = [];
  const createdImageIds: number[] = [];

  try {
    const results: UploadedImage[] = [];

    for (const [index, file] of input.files.entries()) {
      const mediaType = validateAndResolveMediaType(file);

      const storageKey = buildReviewImageKey(
        input.experienceId,
        input.reviewId,
        file.originalname,
        mediaType,
      );

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      uploadedKeys.push(storageKey);

      const url = `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${storageKey}`;

      const image = await prisma.image.create({
        data: {
          createdBy: input.createdBy,
          experienceId: input.experienceId,
          reviewId: input.reviewId,
          storageKey,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          mediaType,
          url,
          sortOrder: index,
        },
      });

      createdImageIds.push(image.id);
      results.push({
        id: image.id,
        storageKey: image.storageKey,
        url: image.url,
        mediaType,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        originalFilename: file.originalname,
      });
    }

    return results;
  } catch (error) {
    if (createdImageIds.length > 0) {
      await prisma.image.deleteMany({
        where: { id: { in: createdImageIds } },
      });
    }

    await deleteUploadedObjects(uploadedKeys);

    throw normalizeUploadError(error, "review");
  }
}

export async function uploadExperienceImages(
  input: UploadExperienceImagesInput,
): Promise<UploadedImage[]> {
  assertUploadConfigConfigured("experience");
  validateUploadFilesCount(input.files);

  const uploadedKeys: string[] = [];
  const createdImageIds: number[] = [];

  try {
    const results: UploadedImage[] = [];

    for (const [index, file] of input.files.entries()) {
      const mediaType = validateAndResolveMediaType(file);

      const storageKey = buildExperienceImageKey(
        input.experienceId,
        file.originalname,
        mediaType,
      );

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      uploadedKeys.push(storageKey);

      const url = `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${storageKey}`;

      const image = await prisma.image.create({
        data: {
          createdBy: input.createdBy,
          experienceId: input.experienceId,
          storageKey,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          mediaType,
          url,
          sortOrder: index,
        },
      });

      createdImageIds.push(image.id);

      results.push({
        id: image.id,
        storageKey: image.storageKey,
        url: image.url,
        mediaType,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        originalFilename: file.originalname,
      });
    }

    return results;
  } catch (error) {
    if (createdImageIds.length > 0) {
      await prisma.image.deleteMany({
        where: { id: { in: createdImageIds } },
      });
    }

    await deleteUploadedObjects(uploadedKeys);

    throw normalizeUploadError(error, "experience");
  }
}

export async function deleteMediaObjectsByStorageKeys(storageKeys: string[]) {
  await deleteUploadedObjects(storageKeys);
}
