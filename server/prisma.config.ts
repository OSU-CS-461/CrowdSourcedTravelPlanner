import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load server/.env regardless of cwd (matches server/src/env.ts).
const prismaConfigDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.join(prismaConfigDir, ".env"),
  override: process.env.NODE_ENV !== "production",
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --import tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
