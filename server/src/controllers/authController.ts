import { Request, Response } from "express";
import { sign } from "../services/authTokenService";
import { createUser, getUserByEmailAndPassword } from "../services/userService";

export const register = async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  const token = sign(user);
  return res.status(201).json({ user, token });
};

export const login = async (req: Request, res: Response) => {
  const user = await getUserByEmailAndPassword(req.body);
  if (user) {
    const token = sign(user);
    return res.status(200).json({ user, token });
  } else {
    return res
      .status(400)
      .json({ error: "Failed to login with email and password." });
  }
};
