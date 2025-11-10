// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { verify } from "../services/authTokenService";
import prisma from "../db/prisma";

export interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verify(token); // { id: string }

    // Optional: fetch full user from DB
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true }, // only id is needed for createdBy
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { id: user.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export { requireAuth }