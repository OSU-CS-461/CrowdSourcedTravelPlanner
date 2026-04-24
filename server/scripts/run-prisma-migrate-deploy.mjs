/**
 * Migrate subprocess must not use `pgbouncer=true` (schema engine → "prepared statement s0").
 * Strip that query param only for this process. Run from tmp cwd without `.env` reload.
 * `npx --prefix <server>` uses the repo's Prisma (avoids global Prisma 7 from another cwd).
 */
import { execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(serverRoot, ".env");

dotenv.config({ path: envPath, override: true });

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("Missing DATABASE_URL in server/.env");
  process.exit(1);
}

function urlForMigrate(urlString) {
  try {
    const u = new URL(urlString);
    u.searchParams.delete("pgbouncer");
    let out = u.toString();
    if (out.endsWith("?")) out = out.slice(0, -1);
    return out;
  } catch {
    return urlString.replace(/[?&]pgbouncer=true(&|$)/gi, "$2").replace(/\?&/, "?");
  }
}

const migrateUrl = urlForMigrate(raw);

const schemaPath = path.join(serverRoot, "prisma", "schema.prisma");
const tmpCwd = os.tmpdir();

const env = {
  ...process.env,
  DATABASE_URL: migrateUrl,
};

const prefix = serverRoot.replace(/\\/g, "/");
const schema = schemaPath.replace(/\\/g, "/");
const cmd = `npx --prefix "${prefix}" prisma migrate deploy --schema "${schema}"`;

try {
  execSync(cmd, {
    cwd: tmpCwd,
    env,
    stdio: "inherit",
    shell: true,
  });
} catch {
  console.error(`
If migrate failed with "prepared statement s0 already exists":
  1) Stop API / other Prisma clients using this DB.
  2) Restart Prisma dev:  npx prisma dev stop default   (confirm)
                      then  npx prisma dev
  3) Run again:  npm run prisma:migrate:deploy
Or use Docker Postgres (see server/.env.example) for a stable local DB.
`);
  process.exit(1);
}
