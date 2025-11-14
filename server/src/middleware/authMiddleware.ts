// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { verify } from "../services/authTokenService";
import prisma from "../db/prisma";

export interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

export async function requireAuth (req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.headers.authorization) {
      throw { status: 401, message: "Missing Authorization header" };
    }

    const token = req.headers.authorization.split(" ")[1];
    const payload = verify(token);

    const user = await prisma.user.findUnique({ where: { id: Number(payload.id) } });
    if (!user) throw { status: 401, message: "User not found" };

    req.user = { id: user.id };
    next();
  } catch (err) {
    next(err); // forwards to centralized error middleware
  }
};