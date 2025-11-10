import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../../generated/prisma/client";

const ARGON_2_PASSWORD_HASH_STUB = "passwordhashmock";

vi.mock("argon2", () => ({
  hash: vi.fn(async () => ARGON_2_PASSWORD_HASH_STUB),
}));

// Mock prisma singleton so the real client never loads
vi.mock("../../db/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));

import prisma from "../../db/prisma";
import * as userModel from "../../models/user";
import type { IUserSignUp } from "../../models/user";
import { createUser } from "../../services/userService";

// Cast prisma to a deep mock we can reset/tweak
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
// Easier than fighting types:
const createMock = prismaMock.user.create as unknown as ReturnType<
  typeof vi.fn
>;

const parseMock = vi
  .spyOn(userModel.UserSignUp, "parseAsync")
  .mockImplementation(async (a: any) => a);

const VALID_USER_SIGNUP = (): IUserSignUp => ({
  email: "drew@example.com",
  password: "rawpassword",
  username: "drewrodrigues",
});

describe("UserService", () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  describe("createUser()", () => {
    it("validates arguments", async () => {
      createMock.mockImplementation(async (args: any) => ({
        id: 1,
        ...args.data,
      }));
      await createUser(VALID_USER_SIGNUP());
      expect(parseMock).toHaveBeenCalledTimes(1);
    });

    describe("with valid params", () => {
      it("creates a user", async () => {
        createMock.mockImplementation(async (args: any) => ({
          id: 1,
          ...args.data,
        }));
        const user = await createUser(VALID_USER_SIGNUP());
        expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
        expect((user as any).id).toBe(1);
      });

      it("hashes the password", async () => {
        createMock.mockImplementation(async (args: any) => ({
          id: 1,
          ...args.data,
        }));
        const user = await createUser(VALID_USER_SIGNUP());
        expect((user as any).passwordDigest).toBe(ARGON_2_PASSWORD_HASH_STUB);
      });

      it("surfaces DB constraint errors", async () => {
        createMock.mockRejectedValue({
          code: "P2002",
          meta: { target: ["email"] },
        });
        await expect(createUser(VALID_USER_SIGNUP())).rejects.toBeTruthy();
      });
    });

    describe("with invalid params", () => {
      it("throws an error", async () => {
        parseMock.mockRejectedValue(new Error("validation failed"));
        await expect(createUser({} as any)).rejects.toBeTruthy();
      });
    });
  });
});
