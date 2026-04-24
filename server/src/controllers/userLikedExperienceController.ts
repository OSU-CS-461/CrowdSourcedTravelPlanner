import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { LikeExperienceBodySchema } from "../models/userLikes";
import * as userLikedExperienceService from "../services/userLikedExperienceService";

export async function listMyLikedExperiences(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const experiences = await userLikedExperienceService.listUserLikedExperiences(
      userId
    );
    return res.status(200).json(experiences);
  } catch (err) {
    return next(err);
  }
}

export async function getMyLikedExperienceStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const experienceId = parseInt(req.params.experienceId, 10);
    if (Number.isNaN(experienceId) || experienceId <= 0) {
      return res.status(400).json({ error: "Invalid experience ID" });
    }
    const liked = await userLikedExperienceService.userHasLikedExperience(
      req.user!.id,
      experienceId
    );
    return res.status(200).json({ liked });
  } catch (err) {
    return next(err);
  }
}

export async function likeExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = LikeExperienceBodySchema.parse(req.body);
    const result = await userLikedExperienceService.addUserLikedExperience(
      req.user!.id,
      body.experienceId
    );
    if (!result.ok) {
      return res.status(404).json({ error: "Experience not found" });
    }
    return res.status(201).json({ liked: true });
  } catch (err) {
    return next(err);
  }
}

export async function unlikeExperience(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const experienceId = parseInt(req.params.experienceId, 10);
    if (Number.isNaN(experienceId) || experienceId <= 0) {
      return res.status(400).json({ error: "Invalid experience ID" });
    }
    await userLikedExperienceService.removeUserLikedExperience(
      req.user!.id,
      experienceId
    );
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
