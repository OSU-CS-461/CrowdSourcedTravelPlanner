import { User } from "../generated/prisma/client";
import { IUserSignUp, UserSignUp } from "../models/user";
import * as argon2d from "argon2";
import prisma from "../db/prisma";
import z from "zod";

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

const EmailAndPasswordRequestContract = z.object({
  email: z.email().toLowerCase(),
  password: z.string(),
});

export const getUserByEmailAndPassword = async (
  _emailAndPasswordArgs: z.infer<typeof EmailAndPasswordRequestContract>
) => {
  const emailAndPasswordArgs = await EmailAndPasswordRequestContract.parseAsync(
    _emailAndPasswordArgs
  );
  const passwordDigest = await argon2d.hash(emailAndPasswordArgs.password);
  const user = await prisma.user.findFirst({
    where: { email: emailAndPasswordArgs.email, passwordDigest },
  });
  if (!user) throw new Error("No user found");
  const { passwordDigest: _omit, ...userWithoutPasswordDigest } = user!;
  return userWithoutPasswordDigest;
};
