import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Always load this file's repo `server/.env`, not `process.cwd()/.env` (cwd varies by IDE / script).
const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".env"
);

// Must run before any import of PrismaClient (see index.ts import order).
// override: dev ensures server/.env wins over a machine-level DATABASE_URL (e.g. old 51214 on Windows).
dotenv.config({
  path: envPath,
  override: process.env.NODE_ENV !== "production",
});

if (process.env.NODE_ENV !== "production") {
  const raw = process.env.DATABASE_URL;
  if (raw) {
    try {
      const u = new URL(raw);
      console.log(
        `[env] DATABASE_URL → ${u.hostname}:${u.port || "(default port)"} (from ${envPath})`
      );
    } catch {
      console.log(`[env] DATABASE_URL is set but not a valid URL (from ${envPath})`);
    }
  } else {
    console.warn(`[env] DATABASE_URL missing after loading ${envPath}`);
  }
}
