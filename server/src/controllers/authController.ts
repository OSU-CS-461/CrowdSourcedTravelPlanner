import { Request, Response } from "express";
import { createUser } from "../services/userService";
import { sign } from "../services/authTokenService";

export const register = async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  const authToken = sign(user);
  res.cookie("authToken", authToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return res.status(201).json(user);
};
