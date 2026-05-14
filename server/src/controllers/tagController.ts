import { NextFunction, Request, Response } from "express";
import * as tagService from "../services/tagService";

async function listTags(
  req: Request, 
  res: Response, 
  next: NextFunction) {
  try {
    const tags = await tagService.listTags();
    return res.status(200).json(tags);
  } catch (err) {
    return next(err);
  }
}

async function getTagById(req: Request, res: Response, next: NextFunction) {
  try {
    const tagId = parseInt(req.params.id, 10);
    if (Number.isNaN(tagId) || tagId <= 0) {
      return next({ status: 400, message: "Invalid tag ID" });
    }
    const tag = await tagService.getTagById(tagId);
    if (!tag) {
      return next({ status: 404, message: "Tag not found" });
    }
    return res.status(200).json(tag);
  } catch (err) {
    return next(err);
  }
}

export { listTags, getTagById };
