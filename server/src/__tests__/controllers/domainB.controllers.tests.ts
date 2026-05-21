import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app";
import prisma from "../../db/prisma";
import { Routes } from "../../routes";
import type { IUserSignUp } from "../../models/user";

let userCounter = 0;

function uniqueUserSignup(): IUserSignUp {
  userCounter += 1;
  return {
    email: `user${userCounter}@test.example`,
    password: "Password123!",
    username: `testuser${userCounter}`,
  };
}

async function registerAndGetToken() {
  const userArgs = uniqueUserSignup();
  const res = await request(app)
    .post(Routes.POST__AUTH_REGISTER)
    .send(userArgs)
    .expect(201);
  return {
    token: res.body.token as string,
    user: res.body.user as { id: number },
    userArgs,
  };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Domain B integration tests: trips, interests, user settings */
describe("Domain B API", () => {
  describe("trips", () => {
    it("POST /api/trips requires auth and creates for owner", async () => {
      await request(app).post("/api/trips").send({ title: "No auth" }).expect(401);

      const { token, user } = await registerAndGetToken();
      const res = await request(app)
        .post("/api/trips")
        .set(auth(token))
        .send({ title: "Pacific Coast" })
        .expect(201);

      expect(res.body).toMatchObject({ title: "Pacific Coast", createdBy: user.id });
    });

    it("PUT /api/trips/:id enforces ownership", async () => {
      const owner = await registerAndGetToken();
      const other = await registerAndGetToken();
      const created = await request(app)
        .post("/api/trips")
        .set(auth(owner.token))
        .send({ title: "Owner trip" })
        .expect(201);

      await request(app)
        .put(`/api/trips/${created.body.id}`)
        .set(auth(other.token))
        .send({ title: "Stolen" })
        .expect(403);
    });
  });

  describe("interests", () => {
    it("POST /api/interests validates body", async () => {
      const { token } = await registerAndGetToken();
      await request(app)
        .post("/api/interests")
        .set(auth(token))
        .send({ name: "A" })
        .expect(400);
      expect(await prisma.interest.count()).toBe(0);
    });

    it("PUT /api/interests/:id enforces ownership", async () => {
      const owner = await registerAndGetToken();
      const other = await registerAndGetToken();
      const created = await request(app)
        .post("/api/interests")
        .set(auth(owner.token))
        .send({ name: "Running" })
        .expect(201);

      await request(app)
        .put(`/api/interests/${created.body.id}`)
        .set(auth(other.token))
        .send({ name: "Stolen" })
        .expect(403);
    });
  });

  describe("user settings", () => {
    it("GET /api/users/me/settings returns defaults", async () => {
      const { token, userArgs } = await registerAndGetToken();
      const res = await request(app)
        .get("/api/users/me/settings")
        .set(auth(token))
        .expect(200);

      expect(res.body).toMatchObject({
        email: userArgs.email,
        preferredFeedSort: "newest",
        themePreference: "light",
      });
    });

    it("PATCH /api/users/me/settings rejects invalid theme", async () => {
      const { token } = await registerAndGetToken();
      await request(app)
        .patch("/api/users/me/settings")
        .set(auth(token))
        .send({ themePreference: "neon" })
        .expect(400);
    });
  });
});
