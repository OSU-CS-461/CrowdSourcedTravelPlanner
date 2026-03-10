import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import * as settingsService from "../services/settingsService";
import { SettingsPatchBodySchema } from "../models/settings";

export async function getSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const settings = await settingsService.getSettingsForUser(req.user.id);
    return res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
}

export async function patchSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = SettingsPatchBodySchema.parse(req.body);
    const settings = await settingsService.updateSettingsForUser(req.user.id, {
      preferredFeedSort: body.preferredFeedSort,
    });
    return res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
}
