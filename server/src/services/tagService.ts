import prisma from "../db/prisma";
import {
  normalizeTagText,
  sanitizeTagLabel,
  slugFromTagText,
} from "../lib/tagText";

const TAG_LIST_SELECT = {
  id: true,
  slug: true,
  label: true,
  categoryId: true,
} as const;

function badRequest(message: string) {
  return { status: 400, message };
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.tag.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listTags() {
  return prisma.tag.findMany({
    select: TAG_LIST_SELECT,
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
    select: TAG_LIST_SELECT,
    where: {
      categoryId: categoryId,
    },
    orderBy: [{ label: "asc" }, { id: "asc" }],
  });
}

export async function createTagForCategory(categoryId: number, name: string) {
  const cleanLabel = sanitizeTagLabel(name);
  const normalizedLabel = normalizeTagText(cleanLabel);

  if (!normalizedLabel) {
    throw badRequest("Tag name is required.");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw badRequest("Invalid categoryId.");
  }

  const existing = await prisma.tag.findUnique({
    where: {
      categoryId_normalizedLabel: {
        categoryId,
        normalizedLabel,
      },
    },
    select: TAG_LIST_SELECT,
  });

  if (existing) {
    return { created: false as const, tag: existing };
  }

  const baseSlug = slugFromTagText(cleanLabel);
  if (!baseSlug) {
    throw badRequest("Tag name must include letters or numbers.");
  }

  let slug = await generateUniqueSlug(baseSlug);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await prisma.tag.create({
        data: {
          label: cleanLabel,
          normalizedLabel,
          slug,
          categoryId,
        },
        select: TAG_LIST_SELECT,
      });

      return { created: true as const, tag: created };
    } catch (err) {
      const isKnown =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";
      if (!isKnown) throw err;

      const duplicate = await prisma.tag.findUnique({
        where: {
          categoryId_normalizedLabel: {
            categoryId,
            normalizedLabel,
          },
        },
        select: TAG_LIST_SELECT,
      });

      if (duplicate) {
        return { created: false as const, tag: duplicate };
      }

      slug = await generateUniqueSlug(baseSlug);
    }
  }

  throw { status: 409, message: "Unable to create a unique tag right now." };
}
