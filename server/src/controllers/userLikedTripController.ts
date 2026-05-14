import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { LikeTripBodySchema } from "../models/userLikes";
import * as userLikedTripService from "../services/userLikedTripService";

export async function listMyLikedTrips(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const trips = await userLikedTripService.listUserLikedTrips(userId);
    return res.status(200).json(trips);
  } catch (err) {
    return next(err);
  }
}

export async function getMyLikedTripStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    if (Number.isNaN(tripId) || tripId <= 0) {
      return next({ status: 400, message: "Invalid trip ID" });
    }
    const liked = await userLikedTripService.userHasLikedTrip(
      req.user!.id,
      tripId
    );
    return res.status(200).json({ liked });
  } catch (err) {
    return next(err);
  }
}

export async function likeTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = LikeTripBodySchema.parse(req.body);
    const result = await userLikedTripService.addUserLikedTrip(
      req.user!.id,
      body.tripId
    );
    if (!result.ok) {
      return next({ status: 404, message: "Trip not found" });
    }
    return res.status(201).json({ liked: true });
  } catch (err) {
    return next(err);
  }
}

export async function unlikeTrip(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    if (Number.isNaN(tripId) || tripId <= 0) {
      return next({ status: 400, message: "Invalid trip ID" });
    }
    await userLikedTripService.removeUserLikedTrip(req.user!.id, tripId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
