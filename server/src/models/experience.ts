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

    // ✅ NEW: filter by creator user id
    createdBy: z.coerce.number().int().positive().optional(),

    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(300).optional(),
    minLat: z.coerce.number().min(-90).max(90).optional(),
    maxLat: z.coerce.number().min(-90).max(90).optional(),
    minLng: z.coerce.number().min(-180).max(180).optional(),
    maxLng: z.coerce.number().min(-180).max(180).optional(),

    // comma separated slugs or ids (your choice) — keeping as string for now
    tags: z.string().min(1).optional(),
    tagMode: z.preprocess(
      (v) => (typeof v === "string" ? v.toLowerCase() : v),
      z.enum(["and", "or"]).optional()
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
    const hasAnyBounds = boundsFields.some((field) => field.value !== undefined);
    const hasAllBounds = boundsFields.every((field) => field.value !== undefined);

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
        .filter((field) => field.value === undefined)
        .forEach((field) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.key],
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
        message: "minLat must be less than or equal to maxLat.",
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
        message: "minLng must be less than or equal to maxLng.",
      });
    }
  });

export type ExpPutPostBody = z.infer<typeof ExpPutPostBodySchema>;
export type ExpPatchBody = z.infer<typeof ExpPatchBodySchema>;
export type ExpListQuery = z.infer<typeof ExpListQuerySchema>;
