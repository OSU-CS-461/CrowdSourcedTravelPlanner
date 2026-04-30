// src/services/experience.service.ts

import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import type { ExpPutPostBody, ExpPatchBody } from "../models/experience";

export type ReviewSortOption = 'recent' | 'highest' | 'lowest' | 'media';

export interface GetExperienceParams {
  experienceId: number;
  reviewSort?: ReviewSortOption;
}
import { uploadExperienceImages } from "./imageService";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../lib/r2";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface ListExperiencesParams {
  limit: number;
  offset: number;
  where?: Prisma.ExperienceWhereInput;
  orderBy?: Prisma.ExperienceOrderByWithRelationInput;
}

export interface UpdateExperienceParams {
  experienceId: number;
  userId: number;
  putData: ExpPutPostBody;
  files?: Express.Multer.File[];
}

export interface EditExperienceParams {
  experienceId: number;
  userId: number;
  patchData: ExpPatchBody;
}

export interface DeleteExperienceParams {
  experienceId: number;
  userId: number;
}

// NEW: create with images
export interface CreateExperienceParams {
  userId: number;
  postBody: ExpPutPostBody;
  files?: Express.Multer.File[];
}

// -----------------------------------------------------------------------------
// SELECTS
// -----------------------------------------------------------------------------

const TAG_SELECT = {
  id: true,
  slug: true,
  label: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      slug: true,
      label: true,
    },
  },
} satisfies Prisma.TagSelect;

const EXPERIENCE_LIST_SELECT = {
  id: true,
  title: true,
  country: true,
  adminRegion: true,
  city: true,
  street: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  thumbnail: true,
  avgRating: true,
  dateCreated: true,
  lastUpdated: true,
  createdBy: true,
  user: {
    select: { username: true },
  },
  categoryId: true,
  category: {
    select: { id: true, slug: true, label: true },
  },
  experienceTags: {
    select: {
      tag: {
        select: TAG_SELECT,
      },
    },
  },
} satisfies Prisma.ExperienceSelect;

const EXPERIENCE_DETAIL_SELECT = (reviewSort?: ReviewSortOption) => {
  let reviewOrder: Prisma.ReviewOrderByWithRelationInput = {
    dateCreated: "desc",
  };

  if (reviewSort === "highest") reviewOrder = { rating: "desc" };
  if (reviewSort === "lowest") reviewOrder = { rating: "asc" };

  return {
    ...EXPERIENCE_LIST_SELECT,
    description: true,
    descriptionEdit: true,
    _count: {
      select: {
        reviews: true,
      },
    },
    reviews: {
      where: reviewSort === "media" ? { images: { some: {} } } : {},
      orderBy: reviewOrder,
      include: {
        user: { select: { username: true } },
      },
    },
    images: {
      select: {
        id: true,
        url: true,
      },
    },
  } satisfies Prisma.ExperienceSelect;
};

// -----------------------------------------------------------------------------
// TYPES (derived)
// -----------------------------------------------------------------------------

type ExperienceListWithJoins = Prisma.ExperienceGetPayload<{
  select: typeof EXPERIENCE_LIST_SELECT;
}>;

type ExperienceDetailWithJoins = Prisma.ExperienceGetPayload<{
  select: ReturnType<typeof EXPERIENCE_DETAIL_SELECT>;
}>;

type ExperienceWithJoins = ExperienceListWithJoins | ExperienceDetailWithJoins;
type ExperienceWithOptionalReviews = ExperienceWithJoins & {
  reviews?: ExperienceDetailWithJoins["reviews"];
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function serializeExperience(experience: ExperienceWithJoins) {
  const experienceWithCounts = experience as ExperienceWithJoins & {
    _count?: { reviews: number };
  };
  const tags = experienceWithCounts.experienceTags.map((jt) => jt.tag);
  const {
    experienceTags: _joined,
    user,
    _count,
    ...rest
  } = experienceWithCounts;
  const reviewCount = _count?.reviews;

  return {
    ...rest,
    createdByUsername: user?.username ?? null,
    tags,
    tagIds: tags.map((t) => t.id),
    reviews: (experienceWithCounts as ExperienceWithOptionalReviews).reviews ?? [],
    ...(reviewCount !== undefined ? { reviewCount } : {}),
  };
}

function badRequest(message: string) {
  return { status: 400, message };
}

async function replaceExperienceTags(
  tx: Prisma.TransactionClient,
  experienceId: number,
  tagIds: number[],
) {
  await tx.experienceTag.deleteMany({ where: { experienceId } });

  if (!tagIds.length) return;

  await tx.experienceTag.createMany({
    data: tagIds.map((tagId) => ({ experienceId, tagId })),
    skipDuplicates: true,
  });
}

async function assertCategoryAndTags(
  tx: Prisma.TransactionClient,
  categoryId: number,
  tagIds: number[],
) {
  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw badRequest("Invalid categoryId.");
  }

  if (!tagIds.length) return;

  const tags = await tx.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, categoryId: true },
  });

  if (tags.length !== tagIds.length) {
    throw badRequest("One or more tagIds are invalid.");
  }

  const hasCrossCategoryTag = tags.some((tag) => tag.categoryId !== categoryId);

  if (hasCrossCategoryTag) {
    throw badRequest("All tagIds must belong to the selected categoryId.");
  }
}

// -----------------------------------------------------------------------------
// CREATE (WITH IMAGE SUPPORT)
// -----------------------------------------------------------------------------

export async function createExperience({
  userId,
  postBody,
  files = [],
}: CreateExperienceParams) {
  let experienceId: number | null = null;
  let uploadedImages: Awaited<ReturnType<typeof uploadExperienceImages>> = [];

  try {
    // STEP 1: Create experience (existing logic)
    await prisma.$transaction(async (tx) => {
      const creator = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!creator) {
        throw { status: 401, message: "Authenticated user not found. Please sign in again." };
      }

      const tagIds = postBody.tagIds ?? [];
      await assertCategoryAndTags(tx, postBody.categoryId, tagIds);

      const created = await tx.experience.create({
        data: {
          createdBy: userId,
          title: postBody.title,
          description: postBody.description,
          categoryId: postBody.categoryId,
          country: postBody.country,
          adminRegion: postBody.adminRegion ?? null,
          city: postBody.city ?? null,
          street: postBody.street ?? null,
          postalCode: postBody.postalCode ?? null,
          latitude: postBody.latitude,
          longitude: postBody.longitude,
          thumbnail: postBody.thumbnail ?? null,
        },
        select: { id: true },
      });

      experienceId = created.id;

      if (tagIds.length) {
        await tx.experienceTag.createMany({
          data: tagIds.map((tagId) => ({
            experienceId: created.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    });

    // STEP 2: Upload images
    if (files.length > 0 && experienceId) {
      uploadedImages = await uploadExperienceImages({
        createdBy: userId,
        experienceId,
        files,
      });

      // 🔥 NEW: auto-set thumbnail if not provided
      if (!postBody.thumbnail && uploadedImages.length > 0) {
        await prisma.experience.update({
          where: { id: experienceId },
          data: {
            thumbnail: uploadedImages[0].url,
          },
        });
      }
    }

    // STEP 3: Return final result
    console.info("[experience.create] Fetching created experience", {
      experienceId,
      userId,
    });
    const finalExperience = await prisma.experience.findUniqueOrThrow({
      where: { id: experienceId! },
      select: EXPERIENCE_DETAIL_SELECT(),
    });

    return {
      ...serializeExperience(finalExperience),
      images: uploadedImages,
    };
  } catch (error) {
    // 🔥 rollback

    if (uploadedImages.length > 0) {
      try {
        await prisma.image.deleteMany({
          where: { id: { in: uploadedImages.map((i) => i.id) } },
        });
      } catch {
        // keep original error
      }

      try {
        await Promise.allSettled(
          uploadedImages.map((img) =>
            r2.send(
              new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET!,
                Key: img.storageKey,
              }),
            ),
          ),
        );
      } catch {
        // keep original error
      }
    }

    if (experienceId) {
      try {
        await prisma.experience.deleteMany({
          where: { id: experienceId },
        });
      } catch {
        // keep original error
      }
    }

    throw error;
  }
}

// -----------------------------------------------------------------------------
// READ ONE
// -----------------------------------------------------------------------------

export async function getExperience(params: GetExperienceParams) {
  const { experienceId, reviewSort } = params;
  
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: EXPERIENCE_DETAIL_SELECT(reviewSort),
  });

  return experience ? serializeExperience(experience) : null;
}

// -----------------------------------------------------------------------------
// LIST
// -----------------------------------------------------------------------------

export async function listExperiences(params: ListExperiencesParams) {
  const { limit, offset, where, orderBy } = params;

  const experiences = await prisma.experience.findMany({
    skip: offset,
    take: limit,
    where,
    select: EXPERIENCE_LIST_SELECT,
    orderBy: orderBy || { lastUpdated: "desc" },
  });

  return experiences.map(serializeExperience);
}

// -----------------------------------------------------------------------------
// UPDATE (PUT)
// -----------------------------------------------------------------------------

export async function updateExperience(params: UpdateExperienceParams) {
  const { experienceId, userId, putData, files = [] } = params;

  const exists = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, categoryId: true },
  });

  if (!exists) return null;

  const updated = await prisma.$transaction(async (tx) => {
    const tagIds = putData.tagIds ?? [];

    if (
      putData.tagIds === undefined &&
      exists.categoryId !== putData.categoryId
    ) {
      throw badRequest("tagIds is required when changing categoryId.");
    }

    await assertCategoryAndTags(tx, putData.categoryId, tagIds);

    await tx.experience.update({
      where: { id: experienceId },
      data: {
        title: putData.title,
        description: putData.description,
        categoryId: putData.categoryId,
        country: putData.country,
        adminRegion: putData.adminRegion ?? null,
        city: putData.city ?? null,
        street: putData.street ?? null,
        postalCode: putData.postalCode ?? null,
        latitude: putData.latitude,
        longitude: putData.longitude,
        thumbnail: putData.thumbnail ?? undefined,
        lastUpdated: new Date(),
      },
    });

    if (putData.tagIds !== undefined) {
      await replaceExperienceTags(tx, experienceId, tagIds);
    }

    return tx.experience.findUniqueOrThrow({
      where: { id: experienceId },
      select: EXPERIENCE_DETAIL_SELECT(),
    });
  });

  if (files.length > 0) {
    const uploadedImages = await uploadExperienceImages({
      createdBy: userId,
      experienceId,
      files,
    });

    if (
      putData.thumbnail === undefined &&
      !updated.thumbnail &&
      uploadedImages.length > 0
    ) {
      await prisma.experience.update({
        where: { id: experienceId },
        data: {
          thumbnail: uploadedImages[0].url,
          lastUpdated: new Date(),
        },
      });
    }
  }

  const refreshed = await prisma.experience.findUniqueOrThrow({
    where: { id: experienceId },
    select: EXPERIENCE_DETAIL_SELECT(),
  });

  return serializeExperience(refreshed);
}

// -----------------------------------------------------------------------------
// PATCH
// -----------------------------------------------------------------------------

export async function editExperience(params: EditExperienceParams) {
  const { experienceId, patchData } = params;

  const exists = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, categoryId: true },
  });

  if (!exists) return null;

  const edited = await prisma.$transaction(async (tx) => {
    await tx.experience.update({
      where: { id: experienceId },
      data: {
        thumbnail: patchData.thumbnail ?? undefined,
        descriptionEdit: patchData.descriptionEdit ?? undefined,
        lastUpdated: new Date(),
      },
    });

    if (patchData.tagIds !== undefined) {
      if (!exists.categoryId) {
        throw badRequest(
          "Cannot set tagIds for an experience without categoryId.",
        );
      }

      await assertCategoryAndTags(tx, exists.categoryId, patchData.tagIds);
      await replaceExperienceTags(tx, experienceId, patchData.tagIds);
    }

    return tx.experience.findUniqueOrThrow({
      where: { id: experienceId },
      select: EXPERIENCE_DETAIL_SELECT(),
    });
  });

  return serializeExperience(edited);
}

// -----------------------------------------------------------------------------
// DELETE
// -----------------------------------------------------------------------------

export async function deleteExperience(params: DeleteExperienceParams) {
  const { experienceId } = params;
  await prisma.experience.delete({ where: { id: experienceId } });
}
