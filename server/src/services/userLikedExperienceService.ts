import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import { EXPERIENCE_LIST_SELECT, serializeExperience } from "./experienceService";

export async function userHasLikedExperience(
  userId: number,
  experienceId: number
): Promise<boolean> {
  const row = await prisma.userLikedExperience.findFirst({
    where: { userId, experienceId },
    select: { userId: true },
  });
  return row !== null;
}

export async function listUserLikedExperiences(userId: number) {
  const rows = await prisma.userLikedExperience.findMany({
    where: { userId },
    orderBy: { dateCreated: "desc" },
    include: {
      experience: {
        select: EXPERIENCE_LIST_SELECT,
      },
    },
  });

  return rows.map((row) => serializeExperience(row.experience));
}

export async function addUserLikedExperience(userId: number, experienceId: number) {
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    select: { id: true },
  });
  if (!experience) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  try {
    await prisma.userLikedExperience.create({
      data: { userId, experienceId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: true as const, alreadyLiked: true };
    }
    throw err;
  }

  return { ok: true as const, alreadyLiked: false };
}

export async function removeUserLikedExperience(userId: number, experienceId: number) {
  await prisma.userLikedExperience.deleteMany({
    where: { userId, experienceId },
  });
}
