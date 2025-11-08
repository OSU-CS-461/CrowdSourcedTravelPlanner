// src/middlewares/errorHandlerMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/binary";

// --- Type guards ---
const isZodError = (err: unknown): err is ZodError =>
  err instanceof ZodError ||
  (typeof err === "object" && err !== null && (err as any).name === "ZodError");

const isPrismaKnownError = (
  err: unknown
): err is PrismaClientKnownRequestError =>
  typeof err === "object" &&
  err !== null &&
  (err as any).name === "PrismaClientKnownRequestError" &&
  typeof (err as any).code === "string";

// TODO: @drew -- add unit tests for this
export default function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod (v4: message contains JSON array of issues)
  if (isZodError(err)) {
    let details: { path: string; message: string }[] = [];
    try {
      const parsed = JSON.parse((err as any).message);
      if (Array.isArray(parsed)) {
        details = parsed.map((e: any) => ({
          path: Array.isArray(e.path) ? e.path.join(".") : String(e.path ?? ""),
          message: e.message,
        }));
      }
    } catch {
      details = [
        { path: "", message: (err as any).message || "Validation failed" },
      ];
    }
    return res.status(400).json({ error: "Validation failed", details });
  }

  // Prisma known request errors
  if (isPrismaKnownError(err)) {
    // Common cases
    switch (err.code) {
      // Using 400 status code for simplicity for now
      case "P2002": {
        // Unique constraint violation
        const model = (err.meta as any)?.modelName as string | undefined;
        const target = (err.meta as any)?.target as
          | string[]
          | string
          | undefined;
        // normalize fields array for client UX
        const fields = Array.isArray(target) ? target : target ? [target] : [];
        return res.status(400).json({
          error: "Unique constraint violation",
          details: { model, fields },
        });
      }
      case "P2003": {
        // Foreign key constraint failed
        const field = (err.meta as any)?.field_name as string | undefined;
        return res.status(400).json({
          error: "Foreign key constraint violation",
          details: { field },
        });
      }
      case "P2025": {
        // Record not found
        return res.status(404).json({
          error: "Record not found",
        });
      }
      default: {
        // Fallback for other Prisma codes
        return res.status(400).json({
          error: "Database error",
          details: { code: err.code },
        });
      }
    }
  }

  // Custom app errors like: throw { status: 401, message: "Unauthorized" }
  if (typeof err === "object" && err && "status" in err && "message" in err) {
    const { status, message } = err as any;
    return res.status(status ?? 500).json({ error: message ?? "Error" });
  }

  // Generic fallback
  if (process.env.NODE_ENV !== "test") {
    console.error("errorHandlerMiddleware hit");
    console.error((err as any)?.stack || err);
  }
  return res.status(500).json({ error: "Something broke" });
}
