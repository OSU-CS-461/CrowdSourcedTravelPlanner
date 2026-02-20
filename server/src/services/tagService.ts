import prisma from "../db/prisma";

export async function listTags() {
  return prisma.tag.findMany({
    orderBy: {
      label: "asc"
    }
  })
}


export async function listByCategoryId(categoryId: number) {
  return prisma.tag.findMany({
    where: {
      categoryId: categoryId,
    },
  });
}