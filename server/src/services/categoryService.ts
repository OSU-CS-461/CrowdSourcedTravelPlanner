import prisma from "../db/prisma";



export async function listCategories() {
  const categories = await prisma.category.findMany();
  return categories;
}