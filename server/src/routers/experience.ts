import { default as express } from "express";
import * as experienceController from "../controllers/experienceController";
import * as authMiddleware from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";
import reviewRouter from "./reviews";

const router = express.Router();

// Create
router.post(
  "/",
  authMiddleware.requireAuth,
  upload.array("images", 10),
  experienceController.createExperience,
);

// Read
router.get("/:id", experienceController.getExperience);
router.get("/", experienceController.listExperiences);

// Update
router.put(
  "/:id",
  authMiddleware.requireAuth,
  upload.array("images", 10),
  experienceController.updateExperience,
);
router.patch(
  "/:id",
  authMiddleware.requireAuth,
  experienceController.editExperience,
);

// Delete (none)
router.delete(
  "/:id",
  authMiddleware.requireAuth,
  experienceController.deleteExperience,
);

router.use("/:id/reviews", reviewRouter);

export default router;
