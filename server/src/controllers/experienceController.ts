import { Request, Response, NextFunction } from "express";
import {
  ExpListQuerySchema,
  ExpPutPostBodySchema,
  ExpPatchBodySchema,
  ExpPutPostBody,
  ExpPatchBody,
  ExpListQuery,
} from "../models/experience";
import { Prisma } from "../generated/prisma/client";
import * as experienceService from "../services/experienceService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// --- tiny helper: no validation, just split/normalize ---
function splitSlugs(csv?: string): string[] {
  if (!csv) return [];
  return Array.from(
    new Set(
      csv
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = firstString(value[i]);
      if (item !== undefined) return item;
    }
    return undefined;
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function optionalString(value: unknown): string | undefined {
  const raw = firstString(value);
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

function numberField(value: unknown): number | undefined {
  const raw = optionalString(value);
  return raw === undefined ? undefined : Number(raw);
}

function numberArrayField(value: unknown): number[] | undefined {
  const rawValues = Array.isArray(value) ? value : [value];
  const parsed = rawValues
    .flatMap((entry) => {
      if (typeof entry === "string") return entry.split(",");
      if (typeof entry === "number" && Number.isFinite(entry)) {
        return [String(entry)];
      }
      return [];
    })
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry));

  return parsed.length ? parsed : undefined;
}

function normalizeCreateBody(rawBody: Record<string, unknown>) {
  return {
    title: optionalString(rawBody.title),
    description: optionalString(rawBody.description),
    categoryId: numberField(rawBody.categoryId),
    country: optionalString(rawBody.country),
    adminRegion: optionalString(rawBody.adminRegion),
    city: optionalString(rawBody.city),
    street: optionalString(rawBody.street),
    postalCode: optionalString(rawBody.postalCode),
    latitude: numberField(rawBody.latitude),
    longitude: numberField(rawBody.longitude),
    thumbnail: optionalString(rawBody.thumbnail),
    tagIds: numberArrayField(rawBody.tagIds),
  };
}

const KM_PER_LAT_DEGREE = 111.32;
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function buildBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / KM_PER_LAT_DEGREE;
  const latRad = toRadians(lat);
  const cosLat = Math.max(Math.cos(latRad), 0.01);
  const lngDelta = radiusKm / (KM_PER_LAT_DEGREE * cosLat);

  return {
    minLat: Math.max(-90, lat - latDelta),
    maxLat: Math.min(90, lat + latDelta),
    minLng: Math.max(-180, lng - lngDelta),
    maxLng: Math.min(180, lng + lngDelta),
  };
}

function haversineDistanceKm(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
) {
  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const aLat = toRadians(latA);
  const bLat = toRadians(latB);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat) * Math.cos(bLat) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// --- CREATE ---
async function createExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const normalizedBody = normalizeCreateBody(
      req.body as Record<string, unknown>,
    );
    const body: ExpPutPostBody = ExpPutPostBodySchema.parse(normalizedBody);

    const files = (req.files as Express.Multer.File[]) ?? [];

    const experience = await experienceService.createExperience({
      userId: req.user!.id,
      postBody: body,
      files,
    });

    return res.status(201).json(experience);
  } catch (err) {
    return next(err);
  }
}

// --- READ ---
async function getExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const experienceId = parseInt(req.params.id);
    const reviewSort = req.query.sort as experienceService.ReviewSortOption | undefined;

    const experience = await experienceService.getExperience({ 
      experienceId, 
      reviewSort 
    });

    if (!experience) {
      return next({ status: 404, message: "Experience not found" });
    }

    return res.status(200).json(experience);
  } catch (err) {
    return next(err);
  }
}

async function listExperiences(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query: ExpListQuery = ExpListQuerySchema.parse(req.query);

    const limit = Math.min(query.limit ?? 20, 50);
    const offset = query.offset ?? 0;
    const hasBoundsSearch =
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLng !== undefined;
    const hasRadiusSearch =
      !hasBoundsSearch && query.lat !== undefined && query.lng !== undefined;
    const radiusKm = query.radiusKm ?? 25;

    const where: Prisma.ExperienceWhereInput = {};

    if (query.createdBy !== undefined) {
      where.createdBy = query.createdBy;
    }

    if (query.title) {
      where.title = { contains: query.title, mode: "insensitive" };
    }
    if (query.country) {
      where.country = query.country;
    }
    if (query.adminRegion) {
      where.adminRegion = { contains: query.adminRegion, mode: "insensitive" };
    }
    if (query.city) {
      where.city = { contains: query.city, mode: "insensitive" };
    }
    if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }

    const tagSlugs = splitSlugs(query.tags);
    const tagMode = query.tagMode || "or";

    if (tagSlugs.length && tagMode === "and") {
      where.AND = tagSlugs.map((slug) => ({
        experienceTags: { some: { tag: { slug: { equals: slug } } } },
      }));
    } else if (tagSlugs.length) {
      where.experienceTags = {
        some: { tag: { slug: { in: tagSlugs } } },
      };
    }

    if (hasBoundsSearch) {
      where.latitude = { gte: query.minLat, lte: query.maxLat };
      where.longitude = { gte: query.minLng, lte: query.maxLng };
    } else if (hasRadiusSearch) {
      const box = buildBoundingBox(query.lat!, query.lng!, radiusKm);
      where.latitude = { gte: box.minLat, lte: box.maxLat };
      where.longitude = { gte: box.minLng, lte: box.maxLng };
    }

    const direction = query.sortDirection || "desc";
    const orderBy: Prisma.ExperienceOrderByWithRelationInput =
      query.sortBy === "avgRating"
        ? { avgRating: direction }
        : query.sortBy === "title"
          ? { title: query.sortDirection || "asc" }
          : { dateCreated: direction };

    if (hasRadiusSearch) {
      const candidateLimit = Math.min(Math.max(limit + offset, 50), 200);
      const candidates = await experienceService.listExperiences({
        limit: candidateLimit,
        offset: 0,
        where,
        orderBy: { dateCreated: "desc" },
      });

      const radiusMatches = candidates
        .map((experience) => ({
          ...experience,
          distanceKm: haversineDistanceKm(
            query.lat!,
            query.lng!,
            experience.latitude,
            experience.longitude,
          ),
        }))
        .filter((experience) => experience.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return res.status(200).json(radiusMatches.slice(offset, offset + limit));
    }

    const experiences = await experienceService.listExperiences({
      limit,
      offset,
      where,
      orderBy,
    });

    return res.status(200).json(experiences);
  } catch (err) {
    return next(err);
  }
}

// ---- UPDATE -----
async function updateExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const experienceId = parseInt(req.params.id);
    const normalizedBody = normalizeCreateBody(
      req.body as Record<string, unknown>,
    );
    const body: ExpPutPostBody = ExpPutPostBodySchema.parse(normalizedBody);
    const files = (req.files as Express.Multer.File[]) ?? [];

    const updatedExperience = await experienceService.updateExperience({
      experienceId,
      userId: req.user!.id,
      putData: body,
      files,
    });

    return res.status(200).json(updatedExperience);
  } catch (err) {
    return next(err);
  }
}

async function editExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const experienceId = parseInt(req.params.id);
    const body: ExpPatchBody = ExpPatchBodySchema.parse(req.body);

    const editedExperience = await experienceService.editExperience({
      experienceId,
      userId: req.user!.id,
      patchData: body,
    });

    return res.status(200).json(editedExperience);
  } catch (err) {
    return next(err);
  }
}

async function deleteExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const experienceId = parseInt(req.params.id);

    await experienceService.deleteExperience({
      experienceId,
      userId: req.user!.id,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export {
  createExperience,
  listExperiences,
  getExperience,
  updateExperience,
  editExperience,
  deleteExperience,
};
