import "dotenv/config"; // TODO: pull into test setup
import { describe, it, expect, beforeEach } from "vitest";

import { createUser } from "../../services/userService";
import prisma from "../../db/prisma";

describe("DB Constraints", () => {
  beforeEach(async () => {
    // TODO: pull into setup
    await prisma.user.deleteMany({ where: {} });
  });

  describe("User", () => {
    it("throws an error on duplicate emails", async () => {
      const first = {
        username: "user_dup_email_1",
        email: "dup@example.com",
        password: "Password123!",
      };
      const created = await createUser(first);
      expect(created).toBeDefined();
      const second = {
        username: "user_dup_email_2",
        email: first.email, // same email to trigger constraint
        password: "AnotherPass123!",
      };
      // expect a Prisma unique-constraint error (P2002) targeting the email field
      return expect(createUser(second)).rejects.toMatchObject({
        code: "P2002",
        meta: { target: ["email"] },
      });
    });

    it("throws an error on duplicate usernames", () => {
      const first = {
        username: "dup_username_1",
        email: "unique1@example.com",
        password: "Password123!",
      };
      return createUser(first).then((created) => {
        expect(created).toBeDefined();
        const second = {
          username: first.username, // same username to trigger constraint
          email: "unique2@example.com",
          password: "AnotherPass123!",
        };
        return expect(createUser(second)).rejects.toMatchObject({
          code: "P2002",
          meta: { target: ["username"] },
        });
      });
    });
  });
});
