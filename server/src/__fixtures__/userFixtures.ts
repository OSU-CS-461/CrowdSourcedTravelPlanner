import { IUserSignUp } from "../models/user";

export const VALID_USER_SIGNUP = (): IUserSignUp => ({
  email: "drew@example.com",
  password: "rawpassword",
  username: "drewrodrigues",
});
