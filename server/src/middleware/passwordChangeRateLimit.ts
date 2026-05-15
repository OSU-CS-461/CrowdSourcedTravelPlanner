import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

const attemptsByKey = new Map<string, RateLimitEntry>();

export function __resetPasswordChangeRateLimitForTests() {
  attemptsByKey.clear();
}

export function passwordChangeRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const key = req.user?.id != null ? `user:${req.user.id}` : `ip:${req.ip}`;
  const now = Date.now();

  const existing = attemptsByKey.get(key);
  if (!existing || existing.resetAt <= now) {
    attemptsByKey.set(key, { attempts: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  existing.attempts += 1;
  attemptsByKey.set(key, existing);

  if (existing.attempts > MAX_ATTEMPTS) {
    return res.status(429).json({
      error: "Too many password change attempts. Please try again later.",
    });
  }

  return next();
}
