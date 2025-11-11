import prisma from "../db/prisma"; // Make sure prisma client is exported from db/index.ts
import { ExpPutPostBody, ExpPatchBody } from "../models/experience";

interface ExperienceCreateInput extends ExpPutPostBody {
    createdBy: number;
}


export async function createExperience(postBody: ExperienceCreateInput ) {
    const experience = await prisma.experience.create({
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
        keywords: postBody.keywords,
      },
      select: {
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
          keywords: true,
          dateCreated: true,
          lastUpdated: true
      },
    });
    return experience;
}

// ---- READ ----

export async function getExperience(experienceId: number) {
    const experience = await prisma.experience.findUnique({
        where: { id: experienceId },
    });

    return experience;
}




interface ListExperiencesParams {
  limit: number;
  offset: number;
  where?: any;
  orderBy?: any;
}


// TODO: implement reviewCount
export async function listExperiences(params: ListExperiencesParams) {
  const { limit, offset, where, orderBy } = params;

  const experiences = await prisma.experience.findMany({
    skip: offset,
    take: limit,
    where: where,
    select: {
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
      lastUpdated: true
    },
    orderBy: orderBy || { lastUpdated: 'desc' },
  });

  return experiences;
}


// --- UPDATE ---


interface UpdateExperienceParams {
    experienceId: number;
    userId: number;
    putData: ExpPutPostBody
}

export async function updateExperience(params: UpdateExperienceParams) {
    const { experienceId, userId, putData } = params;

    const experience = await prisma.experience.findUnique({
        where: { id: experienceId },
        include: { reviews: true }, // fetch reviews to check reviewCount
    });

    if (!experience) return null;

    // check ownership
    if (experience.createdBy !== userId) {
        throw new Error("Forbidden"); // could be handled as 403
    }

    const hasReviews = experience.reviews.length > 0;
    if (hasReviews) {
        throw new Error(`Cannot update after reviews have been added`);
    }

    const updatedExperience = await prisma.experience.update({
        where: { id: experienceId },
        data: putData,
        select: {
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
            keywords: true,
            dateCreated: true,
        },
    });

    return updatedExperience;
}



interface EditExperienceParams {
    experienceId: number;
    userId: number;
    patchData: ExpPatchBody
}


export async function editExperience(params: EditExperienceParams) {
  const { experienceId, userId, patchData } = params;

  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
  })

  if(!experience) return null;

  // check ownership
  if (experience.createdBy !== userId) {
      throw new Error("User does not own this experience!");
  }

  const editedExperience = await prisma.experience.update({
    where: { id: experienceId },
        data: patchData,
        select: {
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
            keywords: true,
            dateCreated: true,
        },
  })

  return editedExperience;
}


interface DeleteExperienceParams {
  experienceId: number,
  userId: number
}

export async function deleteExperience(params: DeleteExperienceParams) {
    const { experienceId, userId } = params
  
    const experience = await prisma.experience.findUnique({
        where: { id: experienceId },
        include: { reviews: true },
    });

    if (!experience) {
      throw { status: 404, message: "Experience not found"};
    }

    // check ownership
    if (experience.createdBy !== userId) {
        throw {status: 403, message: "User does not own this experience!"};
    }

    const hasReviews = experience.reviews.length > 0;
    if (hasReviews) {
      throw {status: 403, message: "Cannot delete after reviews have been added"}
    }

    await prisma.experience.delete({
      where: { id: experienceId },
    });
}