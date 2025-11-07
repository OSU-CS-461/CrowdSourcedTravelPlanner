import { User } from "../generated/prisma/client";
import { IUserSignUp, UserSignUp } from "../models/user";
import * as argon2d from "argon2";
import prisma from "../db/prisma";

export const createUser = async (
  _userSignUpArgs: IUserSignUp
): Promise<User> => {
  const validUserSignUpArgs = await UserSignUp.parseAsync(_userSignUpArgs);
  const { password, ...userSignUpParamsWithoutPassword } = validUserSignUpArgs;
  const passwordDigest = await argon2d.hash(password);
  const user = await prisma.user.create({
    data: { ...userSignUpParamsWithoutPassword, passwordDigest },
  });
  return user;
};

export const getUser = async () => {};
