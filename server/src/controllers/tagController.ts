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

export { listTags };
