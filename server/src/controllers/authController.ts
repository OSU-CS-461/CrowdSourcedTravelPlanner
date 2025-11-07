import { Request, Response } from "express";
import { createUser } from "../services/userService";

export const register = async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  res.cookie("authToken", "<auth-token-here>", {
    secure: process.env.NODE_ENV === "production", // TODO: make sure env vars are set correctly
    httpOnly: true,
  });
  res.json(user);
};
