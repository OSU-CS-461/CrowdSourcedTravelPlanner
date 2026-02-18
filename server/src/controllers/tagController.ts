import { NextFunction, Request, Response } from "express";
import { TagListQuery, TagListQuerySchema } from "../models/tag";
import * as tagService from "../services/tagService";

async function listTags(req: Request, res: Response, next: NextFunction) {
  try {
    const query: TagListQuery = TagListQuerySchema.parse(req.query);
    const tags = await tagService.listTags({
      type: query.type,
      parentCategoryId: query.parentCategoryId,
    });
    return res.status(200).json(tags);
  } catch (err) {
    return next(err);
  }
}

export { listTags };
