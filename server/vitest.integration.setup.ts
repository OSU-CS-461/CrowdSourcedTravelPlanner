import { beforeAll, beforeEach, afterAll } from "vitest";
import { Client as PgClient } from "pg";
import { execa } from "execa";
import prisma from "./src/db/prisma";
import { PrismaClient } from "@prisma/client";

process.env.JWT_SECRET = "pretend-private-key";

const TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/app_test";
process.env.DATABASE_URL = TEST_DATABASE_URL; // for prisma client

const worker = process.env.VITEST_WORKER_ID ?? "1";
const schema = `test_w${worker}`;

// Prisma uses this (note the ?schema=…)
process.env.DATABASE_URL = `${TEST_DATABASE_URL}?schema=${schema}`;

async function ensureRoleAndDatabase(connectionString: string) {
  const url = new URL(connectionString);
  const dbName = url.pathname.slice(1) || "app_test";

  // connect as your mac user to default 'postgres'
  const adminConn = `postgresql://${process.env.USER}@${url.hostname}:${
    url.port || 5432
  }/postgres`;
  const admin = new PgClient({ connectionString: adminConn });
  await admin.connect();
  try {
    await admin.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
          CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';
        END IF;
      END
      $$;
    `);
    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}" OWNER postgres`);
    }
  } finally {
    await admin.end();
  }
}

// ✅ Drop & recreate the per-worker schema to avoid P3009
async function resetWorkerSchema(connectionString: string, schemaName: string) {
  const base = new URL(connectionString);
  // connect to the target DB (not the default 'postgres')
  const conn = base.toString(); // no ?schema here; we’ll address schema via SQL
  const client = new PgClient({ connectionString: conn });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await client.query(`CREATE SCHEMA "${schemaName}";`);
    // optional but harmless: set owner
    await client.query(`ALTER SCHEMA "${schemaName}" OWNER TO postgres;`);
  } finally {
    await client.end();
  }
}

// truncate all tables between tests
async function truncateAll(p: PrismaClient) {
  const tables = await p.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema()
  `;
  if (tables.length) {
    const names = tables.map((t) => `"${t.tablename}"`).join(", ");
    await p.$executeRawUnsafe(
      `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`
    );
  }
}

beforeAll(async () => {
  await ensureRoleAndDatabase(TEST_DATABASE_URL);
  await resetWorkerSchema(TEST_DATABASE_URL, schema); // 👈 wipe any failed _prisma_migrations state
  const { stderr } = await execa("npx", ["prisma", "migrate", "deploy"], {
    // then apply real migrations cleanly
    // { stdio: "inherit" }
    stdio: "pipe", // quiet
  });
  if (stderr) console.debug(stderr);
});

beforeEach(async () => {
  await truncateAll(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});
