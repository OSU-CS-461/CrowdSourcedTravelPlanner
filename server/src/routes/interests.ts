import { default as express } from "express";
import * as interestController from "../controllers/interestController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", requireAuth, interestController.createInterest);

router.get("/:id", interestController.getInterest);
router.get("/", interestController.listInterests);

router.put("/:id", requireAuth, interestController.updateInterest);
router.patch("/:id", requireAuth, interestController.editInterest);

router.delete("/:id", requireAuth, interestController.deleteInterest);

export default router;
