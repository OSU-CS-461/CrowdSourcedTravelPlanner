import "dotenv/config";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import prisma from "../../db/prisma"; // your shared PrismaClient instance

describe("DB Constraints: User", () => {
  // optional: clear data between tests
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("throws P2002 on duplicate emails", async () => {
    const first = {
      username: "user_dup_email_1",
      email: "dup@example.com",
      passwordDigest: "Password123!",
    };
    await prisma.user.create({ data: first });

    const second = {
      username: "user_dup_email_2",
      email: first.email, // duplicate email
      passwordDigest: "AnotherPass123!",
    };

    await expect(prisma.user.create({ data: second })).rejects.toMatchObject({
      code: "P2002",
      meta: { target: ["email"] },
    });
  });

  it("throws P2002 on duplicate usernames", async () => {
    const first = {
      username: "dup_username_1",
      email: "unique1@example.com",
      passwordDigest: "Password123!",
    };
    await prisma.user.create({ data: first });

    const second = {
      username: first.username, // duplicate username
      email: "unique2@example.com",
      passwordDigest: "AnotherPass123!",
    };

    await expect(prisma.user.create({ data: second })).rejects.toMatchObject({
      code: "P2002",
      meta: { target: ["username"] },
    });
  });
});
