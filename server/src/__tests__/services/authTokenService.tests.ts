import { describe, expect, it } from "vitest";
import { sign, verify } from "../../services/authTokenService";
import { User } from "../../generated/prisma/client";

describe("AuthTokenService", () => {
  const STUBBED_ID = "stubbed-id";

  describe("sign()", () => {
    it("returns a valid JWT and verify() returns the payload with the user id", () => {
      const token = sign({ id: STUBBED_ID } as unknown as User);
      expect(token).toBeDefined();
      const payload = verify(token);
      expect(payload).toBeDefined();
      expect(payload.id).toBe(STUBBED_ID);
    });
  });

  describe("verify()", () => {
    it("throws when verifying an invalid token", () => {
      expect(() => verify("this-is-not-a-valid-token")).toThrow();
    });
  });
});
