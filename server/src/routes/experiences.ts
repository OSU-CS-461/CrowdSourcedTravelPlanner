import { default as express } from "express";
import * as experienceController from "../controllers/experienceController";

const router = express.Router();


// Create
router.post("/", experienceController.createExperience);

// Read
router.get('/:id', experienceController.getExperience);
router.get("/", experienceController.listExperiences);
// router.get("/:id/images", experienceController.listExperienceImages);

// Update
router.put("/:id", experienceController.updateExperience);
router.patch("/:id", experienceController.editExperience);

// Delete (none)
router.delete("/:id", experienceController.deleteExperience);


export default router;


