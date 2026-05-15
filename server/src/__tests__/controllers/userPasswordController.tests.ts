import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import { VALID_USER_SIGNUP } from "../../__fixtures__/userFixtures";
import { Routes } from "../../routes";
import { __resetPasswordChangeRateLimitForTests } from "../../middleware/passwordChangeRateLimit";
import prisma from "../../db/prisma";

describe("User password endpoint", () => {
  beforeEach(() => {
    __resetPasswordChangeRateLimitForTests();
  });

  it("changes password when current password is correct", async () => {
    const userArgs = VALID_USER_SIGNUP();
    const registerResponse = await request(app)
      .post(Routes.POST__AUTH_REGISTER)
      .send(userArgs)
      .expect(201);

    const beforePasswordUpdate = await prisma.user.findUniqueOrThrow({
      where: { id: registerResponse.body.user.id as number },
      select: { passwordDigest: true },
    });

    await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        currentPassword: userArgs.password,
        newPassword: "newpassword123",
        confirmNewPassword: "newpassword123",
      })
      .expect(200);

    const afterPasswordUpdate = await prisma.user.findUniqueOrThrow({
      where: { id: registerResponse.body.user.id as number },
      select: { passwordDigest: true },
    });

    expect(afterPasswordUpdate.passwordDigest).not.toEqual(
      beforePasswordUpdate.passwordDigest
    );
    expect(afterPasswordUpdate.passwordDigest).not.toEqual("newpassword123");

    await request(app)
      .post(Routes.POST__AUTH_LOGIN)
      .send({ email: userArgs.email, password: userArgs.password })
      .expect(400);

    await request(app)
      .post(Routes.POST__AUTH_LOGIN)
      .send({ email: userArgs.email, password: "newpassword123" })
      .expect(200);
  });

  it("rejects unauthenticated requests", async () => {
    await request(app)
      .patch("/api/users/me/password")
      .send({
        currentPassword: "abc12345",
        newPassword: "newpassword123",
        confirmNewPassword: "newpassword123",
      })
      .expect(401);
  });

  it("rejects incorrect current password", async () => {
    const userArgs = VALID_USER_SIGNUP();
    const registerResponse = await request(app)
      .post(Routes.POST__AUTH_REGISTER)
      .send(userArgs)
      .expect(201);

    const response = await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        currentPassword: "wrong-password",
        newPassword: "newpassword123",
        confirmNewPassword: "newpassword123",
      })
      .expect(400);

    expect(response.body.error).toBe("Current password is incorrect.");
  });

  it("rejects mismatched and invalid new passwords", async () => {
    const userArgs = VALID_USER_SIGNUP();
    const registerResponse = await request(app)
      .post(Routes.POST__AUTH_REGISTER)
      .send(userArgs)
      .expect(201);

    await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        currentPassword: userArgs.password,
        newPassword: "newpassword123",
        confirmNewPassword: "different-password",
      })
      .expect(400);

    await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        currentPassword: userArgs.password,
        newPassword: "short",
        confirmNewPassword: "short",
      })
      .expect(400);
  });
});
