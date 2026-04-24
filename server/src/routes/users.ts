import { default as express } from "express";
import * as settingsController from "../controllers/settingsController";
import * as userLikedExperienceController from "../controllers/userLikedExperienceController";
import * as userLikedTagController from "../controllers/userLikedTagController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me/settings", requireAuth, settingsController.getSettings);
router.patch("/me/settings", requireAuth, settingsController.patchSettings);

router.get(
  "/me/liked-experiences/status/:experienceId",
  requireAuth,
  userLikedExperienceController.getMyLikedExperienceStatus
);
router.get(
  "/me/liked-experiences",
  requireAuth,
  userLikedExperienceController.listMyLikedExperiences
);
router.post(
  "/me/liked-experiences",
  requireAuth,
  userLikedExperienceController.likeExperience
);
router.delete(
  "/me/liked-experiences/:experienceId",
  requireAuth,
  userLikedExperienceController.unlikeExperience
);

router.get(
  "/me/liked-tags/status/:tagId",
  requireAuth,
  userLikedTagController.getMyLikedTagStatus
);
router.get("/me/liked-tags", requireAuth, userLikedTagController.listMyLikedTags);
router.post("/me/liked-tags", requireAuth, userLikedTagController.likeTag);
router.delete(
  "/me/liked-tags/:tagId",
  requireAuth,
  userLikedTagController.unlikeTag
);

export default router;
