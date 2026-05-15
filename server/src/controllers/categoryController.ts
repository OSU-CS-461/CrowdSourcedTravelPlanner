import { Request, Response, NextFunction} from "express";
import * as categoryService from "../services/categoryService";
import * as tagService from "../services/tagService";
import { CreateTagBodySchema } from "../models/tag";
import { AuthenticatedRequest } from "../middleware/authMiddleware";



// --- READ ---
async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await categoryService.listCategories();
    return res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
}

async function listTagsForCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    
    const tags = await tagService.listByCategoryId(categoryId);
    return res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
}

async function createTagForCategory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const body = CreateTagBodySchema.parse(req.body);
    const result = await tagService.createTagForCategory(categoryId, body.name);
    return res.status(result.created ? 201 : 200).json(result.tag);
  } catch (error) {
    return next(error);
  }
}

export {
  listCategories,
  listTagsForCategory,
  createTagForCategory,
}
