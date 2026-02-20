// src/models/experience.ts
import * as z from "zod";

export const TagIdsSchema = z
  .array(z.number().int().positive())
  .max(50)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "tagIds must not contain duplicates",
  });

export const CategoryIdSchema = z.number().int().positive();

const Iso2CountrySchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase());

// Shared location fields (optional)
const LocationFieldsSchema = z.object({
  country: Iso2CountrySchema, // REQUIRED for create/put
  adminRegion: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

// PUT/POST body (create & full update)
export const ExpPutPostBodySchema = z.object({
  // Required
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  categoryId: CategoryIdSchema,

  // Location + address
  country: LocationFieldsSchema.shape.country,
  adminRegion: LocationFieldsSchema.shape.adminRegion,
  city: LocationFieldsSchema.shape.city,
  street: LocationFieldsSchema.shape.street,
  postalCode: LocationFieldsSchema.shape.postalCode,
  latitude: LocationFieldsSchema.shape.latitude,
  longitude: LocationFieldsSchema.shape.longitude,

  // Optional
  thumbnail: z.string().url().optional(),
  tagIds: TagIdsSchema.optional(),
});

// PATCH body (partial update)
export const ExpPatchBodySchema = z.object({
  thumbnail: z.string().url().optional(),
  tagIds: TagIdsSchema.optional(),
  descriptionEdit: z.string().min(1).max(5000).optional(),
});

// List query parsing
export const ExpListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  sortBy: z.enum(["avgRating", "dateCreated", "reviewCount", "title"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),

  title: z.string().min(1).optional(),
  country: Iso2CountrySchema.optional(),
  adminRegion: z.string().min(1).optional(),
  city: z.string().min(1).optional(),

  // comma separated slugs or ids (your choice) — keeping as string for now
  tags: z.string().min(1).optional(),
  tagMode: z.preprocess(
    (v) => (typeof v === "string" ? v.toLowerCase() : v),
    z.enum(["and", "or"]).optional()
  ),
});

export type ExpPutPostBody = z.infer<typeof ExpPutPostBodySchema>;
export type ExpPatchBody = z.infer<typeof ExpPatchBodySchema>;
export type ExpListQuery = z.infer<typeof ExpListQuerySchema>;
