import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { LikeTagBodySchema } from "../models/userLikes";
import * as userLikedTagService from "../services/userLikedTagService";

export async function listMyLikedTags(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tags = await userLikedTagService.listUserLikedTags(req.user!.id);
    return res.status(200).json(tags);
  } catch (err) {
    return next(err);
  }
}

export async function getMyLikedTagStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tagId = parseInt(req.params.tagId, 10);
    if (Number.isNaN(tagId) || tagId <= 0) {
      return res.status(400).json({ error: "Invalid tag ID" });
    }
    const liked = await userLikedTagService.userHasLikedTag(req.user!.id, tagId);
    return res.status(200).json({ liked });
  } catch (err) {
    return next(err);
  }
}

export async function likeTag(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = LikeTagBodySchema.parse(req.body);
    const result = await userLikedTagService.addUserLikedTag(req.user!.id, body.tagId);
    if (!result.ok) {
      return res.status(404).json({ error: "Tag not found" });
    }
    return res.status(201).json({ liked: true });
  } catch (err) {
    return next(err);
  }
}

export async function unlikeTag(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tagId = parseInt(req.params.tagId, 10);
    if (Number.isNaN(tagId) || tagId <= 0) {
      return res.status(400).json({ error: "Invalid tag ID" });
    }
    await userLikedTagService.removeUserLikedTag(req.user!.id, tagId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
