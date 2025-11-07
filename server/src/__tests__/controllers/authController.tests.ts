import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../app";
import { VALID_USER_SIGNUP } from "../../__fixtures__/userFixtures";
import prisma from "../../db/prisma";

describe.only("AuthController", () => {
  let email: string;
  const password = "Password123!";

  // it("logs in an existing user and returns a token", async () => {
  //   const res = await request(app)
  //     .post("/auth/login")
  //     .send({ email, password });

  //   expect([200, 201]).toContain(res.status);
  //   expect(res.body).toBeDefined();
  //   expect(res.body).toHaveProperty("token");
  //   expect(typeof res.body.token).toBe("string");
  // });

  describe("/api/auth/register", () => {
    describe("with valid args", async () => {
      it("responds with an authToken cookie", async () => {
        const response = await request
          .agent(app)
          .post("/api/auth/register")
          .send(VALID_USER_SIGNUP())
          .expect(200);

        const setCookie = response.headers["set-cookie"] as unknown as string[];
        expect(Array.isArray(setCookie)).toBeTruthy();
        expect(setCookie.some((c) => c.match("authToken"))).toBeTruthy();
      });

      it("creates the user", async () => {
        const userArgs = VALID_USER_SIGNUP();

        expect(await prisma.user.count()).toEqual(0);
        await request
          .agent(app)
          .post("/api/auth/register")
          .send(userArgs)
          .expect(200);

        expect(await prisma.user.count()).toEqual(1);
      });

      it("responds with the correct contract user", async () => {
        const userArgs = VALID_USER_SIGNUP();

        const response = await request
          .agent(app)
          .post("/api/auth/register")
          .send(userArgs)
          .expect(200);

        const { id, passwordDigest, ...storedUser } =
          (await prisma.user.findFirst())!;
        expect(storedUser).toEqual({
          email: userArgs.email,
          username: userArgs.username,
        });
        expect(await prisma.user.count()).toEqual(1);
      });
    });
  });
});
