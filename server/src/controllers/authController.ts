import { Request, Response } from "express";
import { createUser } from "../services/userService";
import { sign } from "../services/authTokenService";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await createUser(req.body);
    const authToken = sign(user);
    res.cookie("authToken", authToken, {
      secure: process.env.NODE_ENV === "production", // TODO: make sure env vars are set correctly
      httpOnly: true,
    });
    return res.status(201).json(user);
  } catch (err) {
    // TODO: @drew add standard format for error messages
    return res.status(400).json({ error: "Error message todo" });
  }
};
