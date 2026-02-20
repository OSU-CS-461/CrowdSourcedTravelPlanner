import { default as express } from "express";
import * as experienceController from "../controllers/experienceController";
import * as authMiddleware from "../middleware/authMiddleware";

const router = express.Router();


// Create
router.post("/",
    authMiddleware.requireAuth,
    experienceController.createExperience
);

// Read
router.get('/:id', experienceController.getExperience);
router.get("/", experienceController.listExperiences);
// router.get("/:id/images", experienceController.listExperienceImages);

// Update
router.put("/:id", 
    authMiddleware.requireAuth,
    experienceController.updateExperience
);
router.patch("/:id", 
    authMiddleware.requireAuth,
    experienceController.editExperience
);

// Delete (none)
router.delete("/:id", 
    authMiddleware.requireAuth,
    experienceController.deleteExperience
);


export default router;


