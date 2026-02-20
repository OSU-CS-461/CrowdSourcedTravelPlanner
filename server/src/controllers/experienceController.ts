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
        .filter(Boolean)
    )
  );
}

// --- CREATE ---
async function createExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body: ExpPutPostBody = ExpPutPostBodySchema.parse(req.body);

    const experience = await experienceService.createExperience(
      req.user!.id,
      body
    );

    return res.status(201).json(experience);
  } catch (err) {
    return next(err);
  }
}

// --- READ ---
async function getExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const experienceId = parseInt(req.params.id);

    const experience = await experienceService.getExperience(experienceId);

    return res.status(200).json(experience);
  } catch (err) {
    return next(err);
  }
}

async function listExperiences(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query: ExpListQuery = ExpListQuerySchema.parse(req.query);

    const limit = Math.min(parseInt(query.limit as unknown as string) || 20, 50);
    const offset = parseInt(query.offset as unknown as string) || 0;

    const where: Prisma.ExperienceWhereInput = {};

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


    const direction = query.sortDirection || "desc";
    const orderBy: Prisma.ExperienceOrderByWithRelationInput =
      query.sortBy === "avgRating"
        ? { avgRating: direction }
        : query.sortBy === "title"
        ? { title: query.sortDirection || "asc" }
        : { dateCreated: direction };

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
  next: NextFunction
) {
  try {
    const experienceId = parseInt(req.params.id);
    const body: ExpPutPostBody = ExpPutPostBodySchema.parse(req.body);

    const updatedExperience = await experienceService.updateExperience({
      experienceId,
      userId: req.user!.id,
      putData: body,
    });

    return res.status(200).json(updatedExperience);
  } catch (err) {
    return next(err);
  }
}

async function editExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
  next: NextFunction
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
