import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";

const TAG_WITH_CATEGORY_SELECT = {
  id: true,
  slug: true,
  label: true,
  categoryId: true,
  category: {
    select: { id: true, slug: true, label: true },
  },
} satisfies Prisma.TagSelect;

export type LikedTagPayload = Prisma.TagGetPayload<{
  select: typeof TAG_WITH_CATEGORY_SELECT;
}>;

export async function userHasLikedTag(userId: number, tagId: number): Promise<boolean> {
  const row = await prisma.userLikedTag.findFirst({
    where: { userId, tagId },
    select: { userId: true },
  });
  return row !== null;
}

export async function listUserLikedTags(userId: number): Promise<LikedTagPayload[]> {
  const rows = await prisma.userLikedTag.findMany({
    where: { userId },
    orderBy: { dateCreated: "desc" },
    include: {
      tag: { select: TAG_WITH_CATEGORY_SELECT },
    },
  });
  return rows.map((r) => r.tag);
}

export async function addUserLikedTag(userId: number, tagId: number) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true },
  });
  if (!tag) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  try {
    await prisma.userLikedTag.create({
      data: { userId, tagId },
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

export async function removeUserLikedTag(userId: number, tagId: number) {
  await prisma.userLikedTag.deleteMany({
    where: { userId, tagId },
  });
}
