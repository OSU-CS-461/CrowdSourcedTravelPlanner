import { default as express } from "express";
import * as interestController from "../controllers/interestController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", requireAuth, interestController.createInterest);

// List route must be registered before `/:id` so `GET /api/interests` is not captured as a detail fetch.
router.get("/", interestController.listInterests);
router.get("/:id", interestController.getInterest);

router.put("/:id", requireAuth, interestController.updateInterest);
router.patch("/:id", requireAuth, interestController.editInterest);

router.delete("/:id", requireAuth, interestController.deleteInterest);

export default router;
