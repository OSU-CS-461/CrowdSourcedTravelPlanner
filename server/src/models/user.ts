import * as z from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const UserSignUp = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  username: z.string(),
});

export type IUserSignUp = z.infer<typeof UserSignUp>;

export const UserPasswordChange = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Use at least ${PASSWORD_MIN_LENGTH} characters.`
      ),
    confirmNewPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords must match.",
  });

export type IUserPasswordChange = z.infer<typeof UserPasswordChange>;
