import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../../generated/prisma/client";

vi.mock("../../db/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));

import prisma from "../../db/prisma";
import { createTagForCategory, listByCategoryId } from "../../services/tagService";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("tagService.listByCategoryId", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  it("requests category tags with stable ordering", async () => {
    (prismaMock.tag.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, slug: "beach", label: "Beach", categoryId: 3 },
    ]);

    await listByCategoryId(3);

    expect(prismaMock.tag.findMany).toHaveBeenCalledWith({
      select: { id: true, slug: true, label: true, categoryId: true },
      where: { categoryId: 3 },
      orderBy: [{ label: "asc" }, { id: "asc" }],
    });
  });
});

describe("tagService.createTagForCategory", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  it("creates a new tag for a valid category", async () => {
    (prismaMock.category.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
    });
    (prismaMock.tag.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prismaMock.tag.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 9,
      slug: "anodize",
      label: "Anodize",
      categoryId: 2,
    });

    const result = await createTagForCategory(2, "  Anodize  ");

    expect(result.created).toBe(true);
    expect(result.tag).toMatchObject({
      id: 9,
      slug: "anodize",
      label: "Anodize",
      categoryId: 2,
    });
  });

  it("rejects empty/whitespace-only names", async () => {
    await expect(createTagForCategory(2, "   ")).rejects.toMatchObject({
      status: 400,
      message: "Tag name is required.",
    });
  });

  it("rejects invalid categories", async () => {
    (prismaMock.category.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      null
    );

    await expect(createTagForCategory(999, "Kayak")).rejects.toMatchObject({
      status: 400,
      message: "Invalid categoryId.",
    });
  });

  it("returns existing tag when duplicate differs only by case/spacing/punctuation", async () => {
    const existing = { id: 4, slug: "lake-lagoon", label: "Lake / Lagoon", categoryId: 2 };

    (prismaMock.category.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
    });
    (prismaMock.tag.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      existing
    );

    const result = await createTagForCategory(2, " LAKE___LAGOON ");

    expect(result.created).toBe(false);
    expect(result.tag).toEqual(existing);
    expect(prismaMock.tag.create).not.toHaveBeenCalled();
  });

  it("allows same normalized name in a different category by generating a unique slug", async () => {
    (prismaMock.category.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
    });

    (prismaMock.tag.findUnique as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (args: unknown) => {
        const parsed = args as
          | { where?: { categoryId_normalizedLabel?: { categoryId: number; normalizedLabel: string } } }
          | { where?: { slug?: string } };
        if ("categoryId_normalizedLabel" in (parsed.where ?? {})) {
          return null;
        }
        if (parsed.where && "slug" in parsed.where) {
          if (parsed.where.slug === "lake-lagoon") return { id: 77 };
          if (parsed.where.slug === "lake-lagoon-2") return null;
        }
        return null;
      }
    );

    (prismaMock.tag.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 18,
      slug: "lake-lagoon-2",
      label: "Lake Lagoon",
      categoryId: 3,
    });

    const result = await createTagForCategory(3, "Lake Lagoon");

    expect(result.created).toBe(true);
    expect(result.tag.slug).toBe("lake-lagoon-2");
  });
});
