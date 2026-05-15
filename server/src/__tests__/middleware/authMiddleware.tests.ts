import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";
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
});
