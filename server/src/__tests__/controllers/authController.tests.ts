import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../app";
import { VALID_USER_SIGNUP } from "../../__fixtures__/userFixtures";
import prisma from "../../db/prisma";

describe("AuthController", () => {
  describe("POST /api/auth/register", () => {
    describe("with valid args", async () => {
      it("responds with an authToken cookie", async () => {
        const response = await request
          .agent(app)
          .post("/api/auth/register")
          .send(VALID_USER_SIGNUP())
          .expect(201);

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
          .expect(201);

        expect(await prisma.user.count()).toEqual(1);
      });

      it("responds with the correct contract", async () => {
        const userArgs = VALID_USER_SIGNUP();

        await request
          .agent(app)
          .post("/api/auth/register")
          .send(userArgs)
          .expect(201);

        const { id, passwordDigest, ...storedUser } =
          (await prisma.user.findFirst())!;
        expect(storedUser).toEqual({
          email: userArgs.email,
          username: userArgs.username,
        });
        expect(await prisma.user.count()).toEqual(1);
      });
    });

    describe("with invalid args", () => {
      it("responds 400 and does not set authToken when required fields are missing", async () => {
        const incomplete = { username: "noemail", password: "Password123!" }; // missing email

        const response = await request
          .agent(app)
          .post("/api/auth/register")
          .send(incomplete)
          .expect(400);

        expect(response.body.error).toBeDefined();
        const setCookie = response.headers["set-cookie"] as unknown as
          | string[]
          | undefined;
        expect(setCookie).toBeUndefined();
        expect(await prisma.user.count()).toEqual(0);
      });

      it("does not create a second user with the same email", async () => {
        const userArgs = VALID_USER_SIGNUP();

        // create first user
        await request
          .agent(app)
          .post("/api/auth/register")
          .send(userArgs)
          .expect(201);
        expect(await prisma.user.count()).toEqual(1);

        // attempt to create another user with same email
        const duplicate = {
          ...VALID_USER_SIGNUP(),
          email: userArgs.email,
          username: "othername",
        };
        const response = await request
          .agent(app)
          .post("/api/auth/register")
          .send(duplicate)
          .expect(400);

        const setCookie = response.headers["set-cookie"] as unknown as
          | string[]
          | undefined;
        // ensure no new auth cookie for failed attempt
        if (setCookie) {
          expect(setCookie.some((c) => c.match("authToken"))).toBeFalsy();
        }
        // still only one user in DB
        expect(await prisma.user.count()).toEqual(1);
      });
    });
  });
});
