// src/services/experience.service.ts
import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import type { ExpPutPostBody, ExpPatchBody } from "../models/experience";

/**
 * New architecture assumptions:
 * - Controller validates req.body with Zod and passes typed ExpPutPostBody / ExpPatchBody.
 * - Controller supplies userId (createdBy) separately.
 * - Service is DB-only: no validation, minimal branching.
 */

export interface ListExperiencesParams {
  limit: number;
  offset: number;
  where?: Prisma.ExperienceWhereInput;
  orderBy?: Prisma.ExperienceOrderByWithRelationInput;
}

export interface UpdateExperienceParams {
  experienceId: number;
  userId: number; // kept for consistency; optionally enforce ownership later
  putData: ExpPutPostBody;
}

export interface EditExperienceParams {
  experienceId: number;
  userId: number; // kept for consistency; optionally enforce ownership later
  patchData: ExpPatchBody;
}

export interface DeleteExperienceParams {
  experienceId: number;
  userId: number; // kept for consistency; optionally enforce ownership later
}

// --- SELECTS (updated for new Tag/Category schema; removed type/parentCategoryId) ---

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

const EXPERIENCE_DETAIL_SELECT = {
  ...EXPERIENCE_LIST_SELECT,
  description: true,
  descriptionEdit: true,
} satisfies Prisma.ExperienceSelect;

type ExperienceListWithJoins = Prisma.ExperienceGetPayload<{
  select: typeof EXPERIENCE_LIST_SELECT;
}>;
type ExperienceDetailWithJoins = Prisma.ExperienceGetPayload<{
  select: typeof EXPERIENCE_DETAIL_SELECT;
}>;
type ExperienceWithJoins = ExperienceListWithJoins | ExperienceDetailWithJoins;

function serializeExperience(experience: ExperienceWithJoins) {
  const tags = experience.experienceTags.map((jt) => jt.tag);
  const { experienceTags: _joined, user, ...rest } = experience;

  return {
    ...rest,
    createdByUsername: user?.username ?? null,
    tags,
    tagIds: tags.map((t) => t.id),
  };
}

function badRequest(message: string) {
  return { status: 400, message };
}

// --- helper: replace join-table rows safely in a transaction ---
async function replaceExperienceTags(
  tx: Prisma.TransactionClient,
  experienceId: number,
  tagIds: number[]
) {
  // Clear existing
  await tx.experienceTag.deleteMany({ where: { experienceId } });

  // Recreate if any
  if (!tagIds.length) return;

  await tx.experienceTag.createMany({
    data: tagIds.map((tagId) => ({ experienceId, tagId })),
    skipDuplicates: true,
  });
}

async function assertCategoryAndTags(
  tx: Prisma.TransactionClient,
  categoryId: number,
  tagIds: number[]
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
// CREATE
// -----------------------------------------------------------------------------
export async function createExperience(userId: number, postBody: ExpPutPostBody) {
  const createdExperience = await prisma.$transaction(async (tx) => {
    const tagIds = postBody.tagIds ?? [];
    await assertCategoryAndTags(tx, postBody.categoryId, tagIds);

    const created = await tx.experience.create({
      data: {
        createdBy: userId,
        title: postBody.title,
        description: postBody.description,
        categoryId: postBody.categoryId,

        // Country is ISO-2 validated by Zod; store as-is
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

    if (tagIds.length) {
      await tx.experienceTag.createMany({
        data: tagIds.map((tagId) => ({
          experienceId: created.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }

    return tx.experience.findUniqueOrThrow({
      where: { id: created.id },
      select: EXPERIENCE_DETAIL_SELECT,
    });
  });

  return serializeExperience(createdExperience);
}

// -----------------------------------------------------------------------------
// READ ONE
// -----------------------------------------------------------------------------
export async function getExperience(experienceId: number) {
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: EXPERIENCE_DETAIL_SELECT,
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
// FULL UPDATE (PUT semantics)
// -----------------------------------------------------------------------------
export async function updateExperience(params: UpdateExperienceParams) {
  const { experienceId, putData } = params;

  const exists = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true, categoryId: true },
  });
  if (!exists) return null;

  const updated = await prisma.$transaction(async (tx) => {
    const tagIds = putData.tagIds ?? [];

    if (putData.tagIds === undefined && exists.categoryId !== putData.categoryId) {
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

        thumbnail: putData.thumbnail ?? null,

        // If lastUpdated is @updatedAt in Prisma schema, you can remove this line.
        lastUpdated: new Date(),
      },
    });

    // With Zod, tagIds is optional: only replace if provided
    if (putData.tagIds !== undefined) {
      await replaceExperienceTags(tx, experienceId, tagIds);
    }

    return tx.experience.findUniqueOrThrow({
      where: { id: experienceId },
      select: EXPERIENCE_DETAIL_SELECT,
    });
  });

  return serializeExperience(updated);
}

// -----------------------------------------------------------------------------
// PARTIAL UPDATE (PATCH semantics)
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

        // If lastUpdated is @updatedAt in Prisma schema, you can remove this line.
        lastUpdated: new Date(),
      },
    });

    if (patchData.tagIds !== undefined) {
      if (!exists.categoryId) {
        throw badRequest("Cannot set tagIds for an experience without categoryId.");
      }
      await assertCategoryAndTags(tx, exists.categoryId, patchData.tagIds);
      await replaceExperienceTags(tx, experienceId, patchData.tagIds);
    }

    return tx.experience.findUniqueOrThrow({
      where: { id: experienceId },
      select: EXPERIENCE_DETAIL_SELECT,
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
