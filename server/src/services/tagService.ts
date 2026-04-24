import prisma from "../db/prisma";

export async function listTags() {
  return prisma.tag.findMany({
    orderBy: {
      label: "asc"
    }
  })
}

export async function getTagById(tagId: number) {
  return prisma.tag.findUnique({
    where: { id: tagId },
    select: {
      id: true,
      slug: true,
      label: true,
      categoryId: true,
      category: {
        select: { id: true, slug: true, label: true },
      },
    },
  });
}


export async function listByCategoryId(categoryId: number) {
  return prisma.tag.findMany({
    where: {
      categoryId: categoryId,
    },
  });
}