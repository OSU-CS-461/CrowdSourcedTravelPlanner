import prisma from "../db/prisma";
import { Prisma } from "../generated/prisma/client";
import { InterestPutPostBody, InterestPatchBody } from "../models/interest";

interface InterestCreateInput extends InterestPutPostBody {
  createdBy: number;
}

export async function createInterest(postBody: InterestCreateInput) {
  const interest = await prisma.interest.create({
    data: {
      createdBy: postBody.createdBy,
      name: postBody.name,
      description: postBody.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
    },
  });
  return interest;
}

export async function getInterest(interestId: number) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    select: {
      id: true,
      name: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
    },
  });
  return interest;
}

interface ListInterestsParams {
  limit: number;
  offset: number;
  where?: Prisma.InterestWhereInput;
  orderBy?: Prisma.InterestOrderByWithRelationInput;
}

export async function listInterests(params: ListInterestsParams) {
  const { limit, offset, where, orderBy } = params;

  const interests = await prisma.interest.findMany({
    skip: offset,
    take: limit,
    where: where,
    select: {
      id: true,
      name: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
    },
    orderBy: orderBy || { dateCreated: "desc" },
  });

  return interests;
}

interface UpdateInterestParams {
  interestId: number;
  userId: number;
  putData: InterestPutPostBody;
}

export async function updateInterest(params: UpdateInterestParams) {
  const { interestId, userId, putData } = params;

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
  });

  if (!interest) return null;

  if (interest.createdBy !== userId) {
    throw { status: 403, message: "Forbidden" };
  }

  const updatedInterest = await prisma.interest.update({
    where: { id: interestId },
    data: {
      ...putData,
      lastUpdated: new Date(),
    },
    select: {
      id: true,
      name: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
    },
  });

  return updatedInterest;
}

interface EditInterestParams {
  interestId: number;
  userId: number;
  patchData: InterestPatchBody;
}

export async function editInterest(params: EditInterestParams) {
  const { interestId, userId, patchData } = params;

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
  });

  if (!interest) return null;

  if (interest.createdBy !== userId) {
    throw { status: 403, message: "User does not own this interest!" };
  }

  const editedInterest = await prisma.interest.update({
    where: { id: interestId },
    data: {
      ...patchData,
      lastUpdated: new Date(),
    },
    select: {
      id: true,
      name: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
    },
  });

  return editedInterest;
}

interface DeleteInterestParams {
  interestId: number;
  userId: number;
}

export async function deleteInterest(params: DeleteInterestParams) {
  const { interestId, userId } = params;

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
  });

  if (!interest) {
    throw { status: 404, message: "Interest not found" };
  }

  if (interest.createdBy !== userId) {
    throw { status: 403, message: "User does not own this interest!" };
  }

  await prisma.interest.delete({
    where: { id: interestId },
  });
}
