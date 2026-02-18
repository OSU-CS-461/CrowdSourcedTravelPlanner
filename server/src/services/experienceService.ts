import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import { ExpPutPostBody, ExpPatchBody } from "../models/experience";

interface ExperienceCreateInput extends ExpPutPostBody {
  createdBy: number;
}

interface ListExperiencesParams {
  limit: number;
  offset: number;
  where?: Prisma.ExperienceWhereInput;
  orderBy?: Prisma.ExperienceOrderByWithRelationInput;
}

interface UpdateExperienceParams {
  experienceId: number;
  userId: number;
  putData: ExpPutPostBody;
}

interface EditExperienceParams {
  experienceId: number;
  userId: number;
  patchData: ExpPatchBody;
}

interface DeleteExperienceParams {
  experienceId: number;
  userId: number;
}

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
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          slug: true,
          label: true,
          type: true,
          parentCategoryId: true,
        },
      },
    },
  },
} satisfies Prisma.ExperienceSelect;

const EXPERIENCE_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  descriptionEdit: true,
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
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          slug: true,
          label: true,
          type: true,
          parentCategoryId: true,
        },
      },
    },
  },
} satisfies Prisma.ExperienceSelect;

type ExperienceListRow = Prisma.ExperienceGetPayload<{
  select: typeof EXPERIENCE_LIST_SELECT;
}>;

type ExperienceDetailRow = Prisma.ExperienceGetPayload<{
  select: typeof EXPERIENCE_DETAIL_SELECT;
}>;

function serializeExperience<T extends ExperienceListRow | ExperienceDetailRow>(
  experience: T
) {
  const tags = experience.tags.map((joinedTag) => joinedTag.tag);
  const categoryTags = tags.filter((tag) => tag.type === "CATEGORY");
  const featureTags = tags.filter((tag) => tag.type === "FEATURE");
  const { tags: _joinedTags, ...rest } = experience;
  return {
    ...rest,
    tags,
    tagIds: tags.map((tag) => tag.id),
    categoryTags,
    featureTags,
  };
}

async function validateTagIds(tagIds: number[] | undefined) {
  if (tagIds === undefined) return undefined;

  const uniqueTagIds = [...new Set(tagIds)];
  if (uniqueTagIds.length === 0) return [];

  const existingTags = await prisma.tag.findMany({
    where: { id: { in: uniqueTagIds } },
    select: { id: true },
  });
  const existingTagIds = new Set(existingTags.map((tag) => tag.id));
  const missingTagIds = uniqueTagIds.filter((id) => !existingTagIds.has(id));

  if (missingTagIds.length > 0) {
    throw {
      status: 400,
      message: `Invalid tagIds: ${missingTagIds.join(", ")}`,
    };
  }

  return uniqueTagIds;
}

async function replaceExperienceTags(
  tx: Prisma.TransactionClient,
  experienceId: number,
  tagIds: number[]
) {
  await tx.experienceTag.deleteMany({ where: { experienceId } });

  if (tagIds.length === 0) {
    return;
  }

  await tx.experienceTag.createMany({
    data: tagIds.map((tagId) => ({ experienceId, tagId })),
    skipDuplicates: true,
  });
}

export async function createExperience(postBody: ExperienceCreateInput) {
  const validatedTagIds = await validateTagIds(postBody.tagIds);

  const createdExperience = await prisma.$transaction(async (tx) => {
    const created = await tx.experience.create({
      data: {
        createdBy: postBody.createdBy,
        title: postBody.title,
        description: postBody.description,
        country: postBody.country,
        adminRegion: postBody.adminRegion,
        city: postBody.city,
        street: postBody.street,
        postalCode: postBody.postalCode,
        latitude: postBody.latitude,
        longitude: postBody.longitude,
        thumbnail: postBody.thumbnail,
      },
      select: { id: true },
    });

    if (validatedTagIds && validatedTagIds.length > 0) {
      await tx.experienceTag.createMany({
        data: validatedTagIds.map((tagId) => ({
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

export async function getExperience(experienceId: number) {
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: EXPERIENCE_DETAIL_SELECT,
  });

  if (!experience) return null;
  return serializeExperience(experience);
}

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

export async function updateExperience(params: UpdateExperienceParams) {
  const { experienceId, userId, putData } = params;
  const validatedTagIds = await validateTagIds(putData.tagIds);

  return prisma.$transaction(async (tx) => {
    const experience = await tx.experience.findUnique({
      where: { id: experienceId },
      include: { reviews: true },
    });

    if (!experience) return null;

    if (experience.createdBy !== userId) {
      throw { status: 403, message: "User does not own this experience!" };
    }

    const hasReviews = experience.reviews.length > 0;
    if (hasReviews) {
      throw { status: 403, message: "Cannot update after reviews have been added" };
    }

    await tx.experience.update({
      where: { id: experienceId },
      data: {
        title: putData.title,
        description: putData.description,
        country: putData.country,
        adminRegion: putData.adminRegion,
        city: putData.city,
        street: putData.street,
        postalCode: putData.postalCode,
        latitude: putData.latitude,
        longitude: putData.longitude,
        thumbnail: putData.thumbnail,
        lastUpdated: new Date(),
      },
    });

    if (validatedTagIds !== undefined) {
      await replaceExperienceTags(tx, experienceId, validatedTagIds);
    }

    const updated = await tx.experience.findUniqueOrThrow({
      where: { id: experienceId },
      select: EXPERIENCE_DETAIL_SELECT,
    });

    return serializeExperience(updated);
  });
}

export async function editExperience(params: EditExperienceParams) {
  const { experienceId, userId, patchData } = params;
  const validatedTagIds = await validateTagIds(patchData.tagIds);

  return prisma.$transaction(async (tx) => {
    const experience = await tx.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) return null;

    if (experience.createdBy !== userId) {
      throw { status: 403, message: "User does not own this experience!" };
    }

    await tx.experience.update({
      where: { id: experienceId },
      data: {
        thumbnail: patchData.thumbnail,
        descriptionEdit: patchData.descriptionEdit,
        lastUpdated: new Date(),
      },
    });

    if (validatedTagIds !== undefined) {
      await replaceExperienceTags(tx, experienceId, validatedTagIds);
    }

    const edited = await tx.experience.findUniqueOrThrow({
      where: { id: experienceId },
      select: EXPERIENCE_DETAIL_SELECT,
    });

    return serializeExperience(edited);
  });
}

export async function deleteExperience(params: DeleteExperienceParams) {
  const { experienceId, userId } = params;

  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    include: { reviews: true },
  });

  if (!experience) {
    throw { status: 404, message: "Experience not found" };
  }

  if (experience.createdBy !== userId) {
    throw { status: 403, message: "User does not own this experience!" };
  }

  const hasReviews = experience.reviews.length > 0;
  if (hasReviews) {
    throw { status: 403, message: "Cannot delete after reviews have been added" };
  }

  await prisma.experience.delete({
    where: { id: experienceId },
  });
}
