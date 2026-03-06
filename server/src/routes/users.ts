import { default as express } from "express";
import * as settingsController from "../controllers/settingsController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me/settings", requireAuth, settingsController.getSettings);
router.patch("/me/settings", requireAuth, settingsController.patchSettings);

export default router;
