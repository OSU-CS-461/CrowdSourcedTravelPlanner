import { User } from "../generated/prisma/client";
import {
  IUserPasswordChange,
  IUserSignUp,
  UserPasswordChange,
  UserSignUp,
} from "../models/user";
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
  const { email, password } = await EmailAndPasswordRequestContract.parseAsync(
    _emailAndPasswordArgs
  );
  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValidPassword = await argon2d.verify(user.passwordDigest, password);
  if (!isValidPassword) {
    return null;
  }
  return user;
};

export const changePasswordForUser = async (
  userId: number,
  _passwordChangeArgs: IUserPasswordChange
) => {
  const { currentPassword, newPassword } = await UserPasswordChange.parseAsync(
    _passwordChangeArgs
  );

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordDigest: true },
  });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const isCurrentPasswordValid = await argon2d.verify(
    user.passwordDigest,
    currentPassword
  );
  if (!isCurrentPasswordValid) {
    throw { status: 400, message: "Current password is incorrect." };
  }

  const passwordDigest = await argon2d.hash(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordDigest },
  });

  return { success: true };
};
