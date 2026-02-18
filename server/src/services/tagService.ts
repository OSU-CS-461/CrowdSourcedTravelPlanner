import prisma from "../db/prisma";
import type { TagType } from "../generated/prisma/enums";

interface ListTagsParams {
  type?: TagType;
  parentCategoryId?: number;
}

export async function listTags(params: ListTagsParams = {}) {
  const { type, parentCategoryId } = params;

  return prisma.tag.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(parentCategoryId ? { parentCategoryId } : {}),
    },
    select: {
      id: true,
      slug: true,
      label: true,
      type: true,
      parentCategoryId: true,
    },
    orderBy: [{ type: "asc" }, { label: "asc" }],
  });
}
