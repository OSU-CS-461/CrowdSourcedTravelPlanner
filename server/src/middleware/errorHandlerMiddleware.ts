import { PrismaClientKnownRequestError } from "@prisma/client/runtime/binary";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

const isZodError = (err: unknown): err is ZodError =>
  err instanceof ZodError || asRecord(err)?.name === "ZodError";

const isPrismaKnownError = (
  err: unknown
): err is PrismaClientKnownRequestError =>
  asRecord(err)?.name === "PrismaClientKnownRequestError" &&
  typeof asRecord(err)?.code === "string";

export default function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (isZodError(err)) {
    let details: { path: string; message: string }[] = [];
    try {
      const message = typeof asRecord(err)?.message === "string" ? asRecord(err)?.message : "";
      const parsed = JSON.parse(message);
      if (Array.isArray(parsed)) {
        details = parsed.map((item) => {
          const parsedItem = asRecord(item);
          const parsedPath = parsedItem?.path;
          const messageValue = parsedItem?.message;
          return {
            path: Array.isArray(parsedPath)
              ? parsedPath.map((segment) => String(segment)).join(".")
              : String(parsedPath ?? ""),
            message: typeof messageValue === "string" ? messageValue : "Validation failed",
          };
        });
      }
    } catch {
      const fallbackMessage =
        typeof asRecord(err)?.message === "string"
          ? asRecord(err)?.message
          : "Validation failed";
      details = [
        { path: "", message: fallbackMessage },
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
        const meta = asRecord(err.meta);
        const model =
          typeof meta?.modelName === "string" ? meta.modelName : undefined;
        const target = meta?.target;
        // normalize fields array for client UX
        const fields = Array.isArray(target)
          ? target.filter((field): field is string => typeof field === "string")
          : typeof target === "string"
            ? [target]
            : [];
        return res.status(400).json({
          error: "Unique constraint violation",
          details: { model, fields },
        });
      }
      case "P2003": {
        // Foreign key constraint failed
        const meta = asRecord(err.meta);
        const field =
          typeof meta?.field_name === "string" ? meta.field_name : undefined;
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
      case "P2021": {
        // Table does not exist (schema out of sync with Prisma schema/client)
        return res.status(500).json({
          error:
            "Database schema is out of date. Run Prisma migrations (prisma migrate deploy).",
          details: { code: err.code },
        });
      }
      case "P5010": {
        return res.status(500).json({
          error: "Failed to contact the database.",
        });
      }
      case "P1000":
      case "P1001":
      case "P1002":
      case "P1003": {
        return res.status(503).json({
          error:
            "Cannot reach the database. Check DATABASE_URL, that Prisma dev (or Postgres) is running, then restart the API.",
          details: { code: err.code },
        });
      }
      default: {
        // Other Prisma engine/query errors — include code so the UI is not a blind "Database error"
        return res.status(500).json({
          error: err.message || "Database error",
          details: { code: err.code },
        });
      }
    }
  }

  // Custom app errors like: throw { status: 401, message: "Unauthorized" }
  if (typeof err === "object" && err && "status" in err && "message" in err) {
    const record = asRecord(err);
    const status = typeof record?.status === "number" ? record.status : 500;
    const message = typeof record?.message === "string" ? record.message : "Error";
    return res.status(status).json({ error: message });
  }

  const defaultMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Unknown error";
  return res.status(500).json({ error: defaultMessage });
}
