import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as interestService from "../services/interestService";
import {
  InterestPutPostBodySchema,
  InterestPatchBodySchema,
  InterestListQuerySchema,
} from "../models/interest";
import { Prisma } from "../generated/prisma/client";

async function createInterest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = InterestPutPostBodySchema.parse(req.body);

    if (!req.user) {
      throw { status: 401, message: "Unauthorized" };
    }

    const interest = await interestService.createInterest({
      ...body,
      createdBy: req.user.id,
    });

    return res.status(201).json(interest);
  } catch (err) {
    return next(err);
  }
}

async function getInterest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interestId = parseInt(req.params.id as string);

    if (isNaN(interestId) || interestId <= 0) {
      throw { status: 400, message: "Invalid interest ID" };
    }

    const interest = await interestService.getInterest(interestId);

    if (!interest) {
      throw { status: 404, message: "No interest with this id exists" };
    }

    return res.status(200).json(interest);
  } catch (err) {
    return next(err);
  }
}

async function listInterests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = InterestListQuerySchema.parse(req.query);

    const limit = Math.min(parseInt(query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const where: Prisma.InterestWhereInput = {};

    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }

    const orderBy: Prisma.InterestOrderByWithRelationInput = {};

    const direction = query.sortDirection || "desc";
    switch (query.sortBy) {
      case "name":
        orderBy.name = direction;
        break;
      default:
        orderBy.dateCreated = direction;
    }

    const interests = await interestService.listInterests({
      limit,
      offset,
      where,
      orderBy,
    });

    return res.status(200).json(interests);
  } catch (err) {
    return next(err);
  }
}

async function updateInterest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const interestId = parseInt(req.params.id as string);

    if (isNaN(interestId) || interestId <= 0) {
      throw { status: 401, message: "Invalid interest ID" };
    }

    const body = InterestPutPostBodySchema.parse(req.body);

    if (!req.user) {
      throw { status: 401, message: "Unauthorized" };
    }

    const updatedInterest = await interestService.updateInterest({
      interestId: interestId,
      userId: req.user.id,
      putData: body,
    });

    if (!updatedInterest) {
      throw { status: 404, message: "Interest not found or not editable" };
    }

    return res.status(200).json(updatedInterest);
  } catch (err) {
    return next(err);
  }
}

async function editInterest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const interestId = parseInt(req.params.id as string);
    if (isNaN(interestId) || interestId <= 0) {
      throw { status: 401, message: "Invalid interest ID" };
    }

    const body = InterestPatchBodySchema.parse(req.body);
    if (!req.user) {
      throw { status: 401, message: "Unauthorized" };
    }

    const editedInterest = await interestService.editInterest({
      interestId: interestId,
      userId: req.user.id,
      patchData: body,
    });

    if (!editedInterest) {
      throw { status: 404, message: "Interest not found" };
    }

    return res.status(200).json(editedInterest);
  } catch (err) {
    return next(err);
  }
}

async function deleteInterest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const interestId = parseInt(req.params.id as string);

    if (!req.user) {
      throw { status: 401, message: "Unauthorized" };
    }

    await interestService.deleteInterest({
      interestId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export {
  createInterest,
  listInterests,
  getInterest,
  updateInterest,
  editInterest,
  deleteInterest,
};
