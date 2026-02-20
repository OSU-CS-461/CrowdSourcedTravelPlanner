import { default as express } from "express";
import * as tripController from "../controllers/tripController";
import * as authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

// Create
router.post("/",
  authMiddleware.requireAuth,
  tripController.createTrip
);

// Read
router.get("/",
authMiddleware.requireAuth,
tripController.listTrips);

router.get("/:id", tripController.getTrip);

// Update
router.put("/:id",
  authMiddleware.requireAuth,
  tripController.updateTrip
);

router.patch("/:id",
  authMiddleware.requireAuth,
  tripController.editTrip
);

// Delete
router.delete("/:id",
  authMiddleware.requireAuth,
  tripController.deleteTrip
);

// Trip and Experience linking
router.post("/:id/experiences",
  authMiddleware.requireAuth,
  tripController.addExperienceToTrip
);

router.delete("/:id/experiences/:experienceId",
  authMiddleware.requireAuth,
  tripController.removeExperienceFromTrip
);

export default router;