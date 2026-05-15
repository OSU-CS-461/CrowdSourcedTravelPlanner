import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";

const { findUniqueMock, verifyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock("../../db/prisma", () => ({
  default: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("../../services/authTokenService", () => ({
  verify: verifyMock,
}));

import { requireAuth, type AuthenticatedRequest } from "../../middleware/authMiddleware";

describe("authMiddleware.requireAuth", () => {
  it("returns 401 when authorization header is missing", async () => {
    const req = {
      headers: {},
    } as unknown as AuthenticatedRequest;
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: "Missing Authorization header" });
  });

  it("sets req.user and calls next when token and user are valid", async () => {
    verifyMock.mockReturnValue({ id: "42" });
    findUniqueMock.mockResolvedValue({ id: 42 });

    const req = {
      headers: { authorization: "Bearer token123" },
    } as unknown as AuthenticatedRequest;
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const res = { status, json } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith("token123");
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 42 },
      select: { id: true },
    });
    expect(req.user).toEqual({ id: 42 });
    expect(next).toHaveBeenCalled();
  });
});
