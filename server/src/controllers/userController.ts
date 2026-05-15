import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as userService from "../services/userService";

export async function patchMyPassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await userService.changePasswordForUser(req.user.id, req.body);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
}
