import { beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Client as PgClient } from "pg";
import { execa } from "execa";
import prisma from "./src/db/prisma";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/app_test";

const worker = process.env.VITEST_WORKER_ID ?? "1";
const schema = `test_w${worker}`;

// Point Prisma to this schema
process.env.DATABASE_URL = `${TEST_DATABASE_URL}?schema=${schema}`;

// 🔧 Ensures both the role and database exist
async function ensureRoleAndDatabase(connectionString: string) {
  const url = new URL(connectionString);
  const dbName = url.pathname.slice(1) || "app_test";

  // Connect as your local mac user to default 'postgres' DB
  const adminConn = `postgresql://${process.env.USER}@${url.hostname}:${
    url.port || 5432
  }/postgres`;
  const admin = new PgClient({ connectionString: adminConn });
  await admin.connect();

  try {
    // Create the postgres role if missing
    await admin.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
          CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
        END IF;
      END
      $$;
    `);

    // Create the test database if missing
    const res = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (res.rowCount === 0) {
      console.log(`🪄 Creating test database '${dbName}' owned by postgres...`);
      await admin.query(`CREATE DATABASE "${dbName}" OWNER postgres`);
    }
  } finally {
    await admin.end();
  }
}

// Optional: truncate between tests
async function truncateAll(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema()
  `;
  if (tables.length) {
    const names = tables.map((t) => `"${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`
    );
  }
}

// -----------------------------------------------------------------------------
// Vitest lifecycle
// -----------------------------------------------------------------------------
beforeAll(async () => {
  // 1. Ensure role + DB exist
  await ensureRoleAndDatabase(TEST_DATABASE_URL);

  // 2. Apply migrations to the per-worker schema
  await execa("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
});

beforeEach(async () => {
  await truncateAll(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});
