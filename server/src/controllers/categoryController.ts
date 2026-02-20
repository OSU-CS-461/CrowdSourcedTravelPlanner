import { Request, Response, NextFunction} from "express";
import * as categoryService from "../services/categoryService";
import * as tagService from "../services/tagService";



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
    
    const tags = await tagService.listByCategoryId(categoryId);
    return res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
}

export {
  listCategories,
  listTagsForCategory
}