import * as z from "zod";

export const TagListQuerySchema = z.object({
  type: z.preprocess(
    (value) => (typeof value === "string" ? value.toUpperCase() : value),
    z.enum(["CATEGORY", "FEATURE"]).optional()
  ),
  parentCategoryId: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    },
    z.number().int().positive().optional()
  ),
});

export type TagListQuery = z.infer<typeof TagListQuerySchema>;
