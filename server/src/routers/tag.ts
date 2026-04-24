import { default as express } from "express";
import * as tagController from "../controllers/tagController";

const router = express.Router();

router.get("/", tagController.listTags);
router.get("/:id", tagController.getTagById);

export default router;
