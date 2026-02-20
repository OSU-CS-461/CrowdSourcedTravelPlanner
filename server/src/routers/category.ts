import { default as express } from "express";
import * as categoryController from "../controllers/categoryController";

const router = express.Router();

router.get("/", categoryController.listCategories);
router.get("/:categoryId/tags", categoryController.listTagsForCategory);


export default router;
