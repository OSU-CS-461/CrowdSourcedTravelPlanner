import { Request, Response, NextFunction} from "express";
import { 
    ExpListQuerySchema, 
    ExpPutPostBodySchema,
    ExpPatchBodySchema,
    ExpPatchBody,
    ExpPutPostBody,
    ExpListQuery
   } from "../models/experience";
import { Prisma } from '../generated/prisma/client';
import * as experienceService from "../services/experienceService";

// --- CREATE ---

import { AuthenticatedRequest } from "../middleware/authMiddleware";

async function createExperience(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
    ) {
    try {
        const body: ExpPutPostBody = ExpPutPostBodySchema.parse(req.body);

        if (!req.user) {
            throw { status: 401, message: "Unauthorized" };
        }

        const experience = await experienceService.createExperience({
            ...body,
            createdBy: req.user.id,
        });

        return res.status(201).json(experience);
    } catch (err) {
        return next(err);
    }
}




// --- READ ---


// TODO: implement reviewCount, inTrips
async function getExperience(
    req: Request, 
    res: Response,
    next: NextFunction
    ) {
    try {
        const experienceId = parseInt(req.params.id as string);

        if (isNaN(experienceId) || experienceId <= 0) {
            throw { status: 400, message: "Invalid experience ID"}
        }

        const experience = await experienceService.getExperience(experienceId);

        if (!experience) {
            throw { status: 404, message: "No experience with this id exists"}
        }

        return res.status(200).json(experience);
    } catch (err) {
        return next(err)
    }
}


// TODO: implement filtering by tags, creator
// TODO: add pagination info to response (nextOffset, prevOffset, etc)
async function listExperiences(
    req: Request, 
    res: Response,
    next: NextFunction
    ) {
    try {
        const query: ExpListQuery = ExpListQuerySchema.parse(req.query);

        // --- Pagination ---

        // limit must be less than 50, default is 20
        const limit = Math.min( (parseInt(query.limit as string) || 20), 50 );
        // offset defaults to 0
        const offset = parseInt(req.query.offset as string) || 0;
        

        // --- Filters ---

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

        // --- Sorting ---
        const orderBy: Prisma.ExperienceOrderByWithRelationInput = {};

        const direction = query.sortDirection || "desc";
        switch (query.sortBy) {
            case 'avgRating':
                orderBy.avgRating = direction;
                break;
            case 'title':
                orderBy.title = query.sortDirection || "asc";
                break;
            // case 'reviewCount':
            //     orderBy.reviewCount = direction;
            //     break;
            default:
                orderBy.dateCreated = direction;
        }

        const experiences = await experienceService.listExperiences({
            limit,
            offset,
            where,
            orderBy,
        });

        return res.status(200).json(experiences);
    } catch (err) {
        next(err);
    }
}


// --- UPDATE ---


async function updateExperience(
    req: AuthenticatedRequest, 
    res: Response,
    next: NextFunction
    ) {
    try {
        const experienceId = parseInt(req.params.id as string);

        if (isNaN(experienceId) || experienceId <= 0) {
            throw { status: 401, message: "Invalid experience ID"}
        }

        const body: ExpPutPostBody = ExpPutPostBodySchema.parse(req.body);

        if (!req.user) {
            throw { status: 401, message: "Unauthorized" };
        }

        const updatedExperience = await experienceService.updateExperience({
            experienceId: experienceId,
            userId: req.user.id,
            putData: body,
        });

        if (!updatedExperience) {
            throw { status: 404, message: "Experience not found or not editable"}
        }

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
        const experienceId = parseInt(req.params.id as string);
        if (isNaN(experienceId) || experienceId <= 0) {
            throw { status: 401, message: "Invalid experience ID"}
        }

        const body: ExpPatchBody = ExpPatchBodySchema.parse(req.body);
        if (!req.user) {
            throw { status: 401, message: "Unauthorized" };
        }

        const editedExperience = await experienceService.editExperience({
            experienceId: experienceId,
            userId: req.user.id,
            patchData: body,
        });

        if (!editedExperience) {
            throw { status: 404, message: "Experience not found"};
        }

        return res.status(200).json(editedExperience);
    } catch (err) {
        next(err);
    }
}


async function deleteExperience(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
    ) {
    try {
        const experienceId = parseInt(req.params.id);

        if (!req.user) {
            throw { status: 401, message: "Unauthorized" };
        }

        await experienceService.deleteExperience({ 
            experienceId, 
            userId: req.user.id
        });

        return res.status(204).send();
    } catch (err) {
        next(err);
    }
}



export { 
    createExperience, 
    listExperiences, 
    getExperience, 
    updateExperience, 
    editExperience, 
    deleteExperience 
};
