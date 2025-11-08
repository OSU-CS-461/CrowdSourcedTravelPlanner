import { Request, Response } from "express";
import prisma from "../db/prisma";
import { 
    ExperienceListQuerySchema, 
    ExperiencePutPostBodySchema,
    ExperiencePatchBodySchema,
    ExperiencePatchBody,
    ExperiencePutPostBody,
    ExperienceListQuery
   } from "../models/experience";
import * as experienceService from "../services/experienceService";

// --- CREATE ---


async function createExperience(req: Request, res: Response) {
    const result = ExperiencePutPostBodySchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }

    const postBody: ExperiencePutPostBody = result.data;

    // TODO: fix once auth is implemented
    const createdBy = 32; // const createdBy = req.user.id;
    
    try {
        const experience = await experienceService.createExperience({
            ...postBody,
            createdBy,
        });
        return res.status(201).json(experience);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create experience" });
    }
}


// --- READ ---


// TODO: implement reviewCount, inTrips
async function getExperience(req: Request, res: Response) {
    try {
        const experienceId = parseInt(req.params.id as string);
        if (isNaN(experienceId) || experienceId <= 0) {
            return res.status(400).json({ error: "Invalid experience ID" });
        }

        const experience = await experienceService.getExperience(experienceId);

        if (!experience) {
            return res.status(404).json({ error: "No experience with this id exists" });
        }

        return res.status(200).json(experience);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve experience"})
    }
}


// TODO: implement filtering by tags, creator
// TODO: add pagination info to response (nextOffset, prevOffset, etc)
async function listExperiences(req: Request, res: Response) {
    const result = ExperienceListQuerySchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }

    const query: ExperienceListQuery = result.data;
    
    try {
        // --- Pagination ---

        // limit must be less than 50, default is 20
        const limit = Math.min( (parseInt(query.limit as string) || 20), 50 );
        // offset defaults to 0
        const offset = parseInt(req.query.offset as string) || 0;
        

        // --- Filters ---

        const where: any = {};

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
        const orderBy: any = {};

        const direction = query.sortDirection || "desc";
        switch (query.sortBy) {
            case 'avgRating':
                orderBy.avgRating = direction;
                break;
            case 'title':
                orderBy.title = query.sortDirection || "asc";
                break;
            case 'reviewCount':
                orderBy.reviewCount = direction;
                break;
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
        console.error(err);
        return res.status(500).json({ error: "Failed to retrieve experiences" });
    }
}


// --- UPDATE ---


async function updateExperience(req: Request, res: Response) {
    const experienceId = parseInt(req.params.id as string);
    if (isNaN(experienceId) || experienceId <= 0) {
        return res.status(400).json({ error: "Invalid experience ID" });
    }

    const result = ExperiencePutPostBodySchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }
    const putData: ExperiencePutPostBody = result.data;

    // TODO: fix once auth is implemented
    const userId = 32; // const userId = req.user.id;

    try {
        const updatedExperience = await experienceService.updateExperience({
            experienceId: experienceId,
            userId,
            putData,
        });

        if (!updatedExperience) {
            return res.status(404).json({ error: "Experience not found or not editable" });
        }

        return res.status(200).json(updatedExperience);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

async function editExperience(req: Request, res: Response) {
    const experienceId = parseInt(req.params.id as string);
    if (isNaN(experienceId) || experienceId <= 0) {
        return res.status(400).json({ error: "Invalid experience ID" });
    }

    const result = ExperiencePatchBodySchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
    }
    const patchData: ExperiencePatchBody = result.data;

    // TODO: fix once auth is implemented
    const userId = 32; // const userId = req.user.id;

    try {
        const editedExperience = await experienceService.editExperience({
            experienceId: experienceId,
            userId,
            patchData,
        });

        if (!editedExperience) {
            return res.status(404).json({ error: "Experience not found" });
        }

        return res.status(200).json(editedExperience);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}


async function deleteExperience(req: Request, res: Response) {
    const experienceId = parseInt(req.params.id);


    // TODO: fix once auth is implemented
    const userId = 32; // const userId = req.user.id;

    try {
        const result = await experienceService.deleteExperience({ experienceId, userId });

        if (!result) {
            return res.status(404).json({ error: "Experience not found" });
        }

        return res.status(204).send();
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}



export { createExperience, listExperiences, getExperience, updateExperience, editExperience, deleteExperience };
