import { default as express } from "express";
import * as categoryController from "../controllers/categoryController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", categoryController.listCategories);
router.get("/:categoryId/tags", categoryController.listTagsForCategory);
router.post("/:categoryId/tags", requireAuth, categoryController.createTagForCategory);


export default router;
