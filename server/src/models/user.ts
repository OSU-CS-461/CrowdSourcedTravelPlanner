import * as z from "zod";

export const UserSignUp = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8),
  username: z.string(),
});

export type IUserSignUp = z.infer<typeof UserSignUp>;
