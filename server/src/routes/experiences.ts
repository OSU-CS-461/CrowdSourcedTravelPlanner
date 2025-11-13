import { default as express } from "express";
import * as experienceController from "../controllers/experienceController";
import * as experienceMiddleware from "../middleware/authMiddleware";

const router = express.Router();


// Create
router.post("/",
    experienceMiddleware.requireAuth,
    experienceController.createExperience
);

// Read
router.get('/:id', experienceController.getExperience);
router.get("/", experienceController.listExperiences);
// router.get("/:id/images", experienceController.listExperienceImages);

// Update
router.put("/:id", 
    experienceMiddleware.requireAuth,
    experienceController.updateExperience
);
router.patch("/:id", 
    experienceMiddleware.requireAuth,
    experienceController.editExperience
);

// Delete (none)
router.delete("/:id", 
    experienceMiddleware.requireAuth,
    experienceController.deleteExperience
);


export default router;


