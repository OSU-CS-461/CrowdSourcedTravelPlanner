// src/models/experience.ts

import * as z from "zod";

// -----------------------------------------------------------------------------
// TAGS & CATEGORY
// -----------------------------------------------------------------------------

export const TagIdsSchema = z
  .array(z.number().int().positive())
  .max(50)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "tagIds must not contain duplicates",
  });

export const CategoryIdSchema = z.number().int().positive();

// -----------------------------------------------------------------------------
// LOCATION
// -----------------------------------------------------------------------------

const Iso2CountrySchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase());

const LocationFieldsSchema = z.object({
  country: Iso2CountrySchema,
  adminRegion: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

// -----------------------------------------------------------------------------
// CREATE / PUT BODY
// -----------------------------------------------------------------------------

/**
 * IMPORTANT:
 * - This schema validates ONLY text fields
 * - Media files are handled separately via multer (req.files)
 * - Do NOT add media file fields here
 */
export const ExpPutPostBodySchema = z.object({
  // Required
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  categoryId: CategoryIdSchema,

  // Location
  country: LocationFieldsSchema.shape.country,
  adminRegion: LocationFieldsSchema.shape.adminRegion,
  city: LocationFieldsSchema.shape.city,
  street: LocationFieldsSchema.shape.street,
  postalCode: LocationFieldsSchema.shape.postalCode,
  latitude: LocationFieldsSchema.shape.latitude,
  longitude: LocationFieldsSchema.shape.longitude,

  // Optional
  thumbnail: z.string().url().optional(), // may be overridden by uploaded image
  tagIds: TagIdsSchema.optional(),
});

// -----------------------------------------------------------------------------
// PATCH BODY
// -----------------------------------------------------------------------------

export const ExpPatchBodySchema = z.object({
  thumbnail: z.string().url().optional(),
  tagIds: TagIdsSchema.optional(),
  descriptionEdit: z.string().min(1).max(5000).optional(),
});

// -----------------------------------------------------------------------------
// LIST QUERY
// -----------------------------------------------------------------------------

export const ExpListQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),

    sortBy: z
      .enum(["avgRating", "dateCreated", "reviewCount", "title", "distance"])
      .optional(),

    sortDirection: z.enum(["asc", "desc"]).optional(),

    title: z.string().min(1).optional(),
    country: Iso2CountrySchema.optional(),
    adminRegion: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    categoryId: z.coerce.number().int().positive().optional(),

    // filter by creator
    createdBy: z.coerce.number().int().positive().optional(),

    // geo filters
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(300).optional(),

    minLat: z.coerce.number().min(-90).max(90).optional(),
    maxLat: z.coerce.number().min(-90).max(90).optional(),
    minLng: z.coerce.number().min(-180).max(180).optional(),
    maxLng: z.coerce.number().min(-180).max(180).optional(),

    tags: z.string().min(1).optional(),

    tagMode: z.preprocess(
      (v) => (typeof v === "string" ? v.toLowerCase() : v),
      z.enum(["and", "or"]).optional(),
    ),
  })
  .superRefine((query, ctx) => {
    const hasLat = query.lat !== undefined;
    const hasLng = query.lng !== undefined;

    const boundsFields = [
      { key: "minLat", value: query.minLat },
      { key: "maxLat", value: query.maxLat },
      { key: "minLng", value: query.minLng },
      { key: "maxLng", value: query.maxLng },
    ] as const;

    const hasAnyBounds = boundsFields.some((f) => f.value !== undefined);
    const hasAllBounds = boundsFields.every((f) => f.value !== undefined);

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasLat ? ["lng"] : ["lat"],
        message: "lat and lng must be provided together.",
      });
    }

    if (query.radiusKm !== undefined && !(hasLat && hasLng)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["radiusKm"],
        message: "radiusKm requires both lat and lng.",
      });
    }

    if (query.sortBy === "distance" && !(hasLat && hasLng)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sortBy"],
        message: "sortBy=distance requires both lat and lng.",
      });
    }

    if (hasAnyBounds && !hasAllBounds) {
      boundsFields
        .filter((f) => f.value === undefined)
        .forEach((f) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [f.key],
            message:
              "minLat, maxLat, minLng, and maxLng must be provided together.",
          });
        });
    }

    if (
      hasAllBounds &&
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLat > query.maxLat
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minLat"],
        message: "minLat must be <= maxLat.",
      });
    }

    if (
      hasAllBounds &&
      query.minLng !== undefined &&
      query.maxLng !== undefined &&
      query.minLng > query.maxLng
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minLng"],
        message: "minLng must be <= maxLng.",
      });
    }
  });

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type ExpPutPostBody = z.infer<typeof ExpPutPostBodySchema>;
export type ExpPatchBody = z.infer<typeof ExpPatchBodySchema>;
export type ExpListQuery = z.infer<typeof ExpListQuerySchema>;
