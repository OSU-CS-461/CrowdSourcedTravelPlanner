import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import * as tripService from "../services/tripService";
import {
  TripPutPostBodySchema,
  TripPatchBodySchema,
  TripListQuerySchema,
  TripPutPostBody,
  TripPatchBody,
  TripListQuery,
} from "../models/trip";
import { AuthenticatedRequest } from "../middleware/authMiddleware";


// --- CREATE ---

async function createTrip(req: AuthenticatedRequest, res: Response, _next: NextFunction) {
  try {
    console.log("REQ.USER:", req.user);
    const body: TripPutPostBody = TripPutPostBodySchema.parse(req.body);

    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);

      if (end < start) {
        throw { status: 400, message: "End date cannot be before start date" };
      }
    }

    if (!req.user) throw { status: 401, message: "Unauthorized" };

    const trip = await tripService.createTrip({
      ...body,
      createdBy: req.user.id,
    });

    return res.status(201).json(trip);
  } catch (err) {
    console.error("CREATE TRIP ERROR:", err);
    return res.status(400).json(err);
  }
}

// --- GET  ---

async function getTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const tripId = parseInt(req.params.id as string);

    if (isNaN(tripId) || tripId <= 0) {
      throw { status: 400, message: "Invalid trip ID" };
    }

    const trip = await tripService.getTrip(tripId);

    if (!trip) throw { status: 404, message: "Trip not found" };

    return res.status(200).json(trip);
  } catch (err) {
    next(err);
  }
}

export async function listMyTrips(req: AuthenticatedRequest, res: Response, next: NextFunction ) {
  try {
    if (!req.user) throw { status: 401, message: "Unauthorized" };

    const trips = await tripService.listMyTrips(req.user.id);

    return res.status(200).json(trips);
  } catch (err) {
    next(err);
  }
}

// --- LIST ---

async function listTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const query: TripListQuery = TripListQuerySchema.parse(req.query);

    const limit = Math.min(parseInt(query.limit as string) || 20, 50);
    const offset = parseInt(query.offset as string) || 0;

    const where: Prisma.TripWhereInput = {};

    if (query.title) {
      where.title = { contains: query.title, mode: "insensitive" };
    }

    const orderBy: Prisma.TripOrderByWithRelationInput = {};
    const direction = query.sortDirection || "desc";

    switch (query.sortBy) {
      case "title":
        orderBy.title = direction;
        break;
      default:
        orderBy.dateCreated = direction;
    }

    const trips = await tripService.listTrips({
      limit,
      offset,
      where,
      orderBy,
    });

    return res.status(200).json(trips);
  } catch (err) {
    next(err);
  }
}


// --- PUT ---

async function updateTrip(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const tripId = parseInt(req.params.id as string);
    const body: TripPutPostBody = TripPutPostBodySchema.parse(req.body);

    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);

      if (end < start) {
        throw { status: 400, message: "End date cannot be before start date" };
      }
    }

    if (!req.user) throw { status: 401, message: "Unauthorized" };

    const updated = await tripService.updateTrip({
      tripId,
      userId: req.user.id,
      putData: body,
    });

    if (!updated) throw { status: 404, message: "Trip not found" };

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}


// --- PATCH ---

async function editTrip(req: AuthenticatedRequest, res: Response, next: NextFunction ) {
  try {
    const tripId = parseInt(req.params.id as string);
    const body: TripPatchBody = TripPatchBodySchema.parse(req.body);

    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);

      if (end < start) {
        throw { status: 400, message: "End date cannot be before start date" };
      }
    }

    if (!req.user) throw { status: 401, message: "Unauthorized" };

    const updated = await tripService.editTrip({
      tripId,
      userId: req.user.id,
      patchData: body,
    });

    if (!updated) throw { status: 404, message: "Trip not found" };

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}


// --- DELETE ---

async function deleteTrip( req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const tripId = parseInt(req.params.id as string);

    if (!req.user) throw { status: 401, message: "Unauthorized" };

    await tripService.deleteTrip({
      tripId,
      userId: req.user.id,
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}


// --- ADD EXPERIENCE ---

async function addExperienceToTrip(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const tripId = parseInt(req.params.id as string);
    const { experienceId } = req.body;

    if (!req.user) throw { status: 401, message: "Unauthorized" };

    if (!experienceId) {
      throw { status: 400, message: "experienceId is required" };
    }

    const result = await tripService.addExperienceToTrip(
      tripId,
      Number(experienceId),
      req.user.id
    );

    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}


// --- REMOVE EXPERIENCE ---

async function removeExperienceFromTrip(req: AuthenticatedRequest, res: Response, next: NextFunction ) {
  try {
    const tripId = parseInt(req.params.id as string);
    const experienceId = parseInt(req.params.experienceId as string);

    if (!req.user) throw { status: 401, message: "Unauthorized" };

    await tripService.removeExperienceFromTrip(
      tripId,
      experienceId,
      req.user.id
    );

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}


export {
  createTrip,
  listTrips,
  getTrip,
  updateTrip,
  editTrip,
  deleteTrip,
  addExperienceToTrip,
  removeExperienceFromTrip,
};
