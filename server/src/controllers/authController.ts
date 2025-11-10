import { Request, Response } from "express";
import { sign } from "../services/authTokenService";
import { createUser, getUserByEmailAndPassword } from "../services/userService";
import { User } from "../generated/prisma/client";

export const register = async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  const { passwordDigest: _omit, ...userWithoutPasswordDigest } = user;
  const token = sign(user as User);
  return res.status(201).json({ user: userWithoutPasswordDigest, token });
};

export const login = async (req: Request, res: Response) => {
  const user = await getUserByEmailAndPassword(req.body);
  if (user) {
    const token = sign(user as User);
    return res.status(200).json({ user, token });
  } else {
    return res
      .status(400)
      .json({ error: "Failed to login with email and password." });
  }
};
