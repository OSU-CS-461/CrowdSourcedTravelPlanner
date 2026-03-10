import * as z from "zod";

export const InterestPutPostBodySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const InterestPatchBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const InterestListQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  sortBy: z.enum(["name", "dateCreated"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  name: z.string().optional(),
});

export type InterestPutPostBody = z.infer<typeof InterestPutPostBodySchema>;
export type InterestPatchBody = z.infer<typeof InterestPatchBodySchema>;
export type InterestListQuery = z.infer<typeof InterestListQuerySchema>;
