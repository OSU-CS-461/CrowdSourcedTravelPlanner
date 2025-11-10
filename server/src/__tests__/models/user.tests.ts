import { describe, it, expect } from "vitest";
import * as z from "zod";
import { IUserSignUp, UserSignUp } from "../../models/user";

const VALID_USER_SIGNUP = (): IUserSignUp => ({
  email: "drew@example.com",
  password: "rawpassword",
  username: "drewrodrigues",
});

describe("User", () => {
  it("returns successful with a valid user", () => {
    expect(UserSignUp.safeParse(VALID_USER_SIGNUP()).success).toBeTruthy();
  });

  it("requires a username", () => {
    const { username: _omit, ...noUsername } = VALID_USER_SIGNUP();

    const user = UserSignUp.safeParse(noUsername);

    const errors = z.flattenError(user.error!);
    expect(errors.fieldErrors.username).toBeTruthy();
  });

  it("lowercases emails", () => {
    const mixedCase = { ...VALID_USER_SIGNUP(), email: "DREW@Example.COM" };
    const parsed = UserSignUp.safeParse(mixedCase);
    expect(parsed.success).toBeTruthy();
    expect(parsed.data!.email).toBe("drew@example.com");
  });

  it("requires an email", () => {
    const { email: _omit, ...noEmail } = VALID_USER_SIGNUP();
    const user = UserSignUp.safeParse(noEmail);

    const errors = z.flattenError(user.error!);
    expect(errors.fieldErrors.email).toBeTruthy();
  });

  it("doesn't allow invalid emails", () => {
    const invalidEmails = [
      "plainaddress",
      "@no-local-part.com",
      "no-at-sign.com",
      "user@.com",
      "user@com",
      "user@site..com",
      "user@site,com",
      "user@site#name.com",
    ];

    invalidEmails.forEach((email) => {
      const candidate = { ...VALID_USER_SIGNUP(), email };
      const result = UserSignUp.safeParse(candidate);

      const errors = z.flattenError(result.error!);
      expect(errors.fieldErrors.email).toBeTruthy();
    });
  });

  it("requires a password of at least 8 characters", () => {
    const tooShortParams = { ...VALID_USER_SIGNUP(), password: "1234567" };
    const tooShortPassword = UserSignUp.safeParse(tooShortParams);

    const errors = z.flattenError(tooShortPassword.error!);
    expect(errors.fieldErrors.password).toBeTruthy();

    const longEnoughParams = { ...VALID_USER_SIGNUP(), password: "12345678" };
    const longEnoughPassword = UserSignUp.safeParse(longEnoughParams);

    expect(longEnoughPassword.success).toBeTruthy();
  });
});
