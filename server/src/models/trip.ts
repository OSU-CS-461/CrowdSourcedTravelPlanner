import { z } from "zod";

// --- CREATE / UPDATE ---
export const TripPutPostBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export type TripPutPostBody = z.infer<typeof TripPutPostBodySchema>;


// --- PATCH ---
export const TripPatchBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type TripPatchBody = z.infer<typeof TripPatchBodySchema>;


// --- LIST QUERY ---
export const TripListQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  title: z.string().optional(),
  sortBy: z.enum(["title", "dateCreated"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export type TripListQuery = z.infer<typeof TripListQuerySchema>;