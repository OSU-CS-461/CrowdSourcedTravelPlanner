import dotenv from "dotenv";

// Must run before any import of PrismaClient (see index.ts import order).
// Machine-level DATABASE_URL on Windows would otherwise override repo .env.
dotenv.config({
  override: process.env.NODE_ENV !== "production",
});
