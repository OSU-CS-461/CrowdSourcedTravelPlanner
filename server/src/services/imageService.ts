import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../db/prisma";
import { r2 } from "../lib/r2";
import { buildExperienceImageKey, buildReviewImageKey } from "../lib/imageKeys";

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
};

export async function uploadReviewImages(
  input: UploadReviewImagesInput,
): Promise<UploadedImage[]> {
  const uploadedKeys: string[] = [];
  const createdImageIds: number[] = [];

  try {
    const results: UploadedImage[] = [];

    for (const [index, file] of input.files.entries()) {
      if (!file.mimetype.startsWith("image/")) {
        throw new Error(`Invalid file type for ${file.originalname}`);
      }

      const storageKey = buildReviewImageKey(
        input.experienceId,
        input.reviewId,
        file.originalname,
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
          url,
          sortOrder: index,
        },
      });

      createdImageIds.push(image.id);
      results.push({
        id: image.id,
        storageKey: image.storageKey,
        url: image.url,
      });
    }

    return results;
  } catch (error) {
    if (createdImageIds.length > 0) {
      await prisma.image.deleteMany({
        where: { id: { in: createdImageIds } },
      });
    }

    await Promise.allSettled(
      uploadedKeys.map((key) =>
        r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: key,
          }),
        ),
      ),
    );

    throw error;
  }
}

export async function uploadExperienceImages(
  input: UploadExperienceImagesInput,
): Promise<UploadedImage[]> {
  const uploadedKeys: string[] = [];
  const createdImageIds: number[] = [];

  try {
    const results: UploadedImage[] = [];

    for (const [index, file] of input.files.entries()) {
      if (!file.mimetype.startsWith("image/")) {
        throw new Error(`Invalid file type for ${file.originalname}`);
      }

      const storageKey = buildExperienceImageKey(
        input.experienceId,
        file.originalname,
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
          url,
          sortOrder: index,
        },
      });

      createdImageIds.push(image.id);

      results.push({
        id: image.id,
        storageKey: image.storageKey,
        url: image.url,
      });
    }

    return results;
  } catch (error) {
    if (createdImageIds.length > 0) {
      await prisma.image.deleteMany({
        where: { id: { in: createdImageIds } },
      });
    }

    await Promise.allSettled(
      uploadedKeys.map((key) =>
        r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: key,
          }),
        ),
      ),
    );

    throw error;
  }
}
