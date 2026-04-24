/**
 * Find which Prisma dev port accepts PostgreSQL (TCP alone is not enough: 51213 may be HTTP).
 * Tries db name `template1` (current Prisma dev default) and `postgres`.
 * Run: cd server && npm run db:probe
 */
import pg from "pg";

const host = "127.0.0.1";
const ports = [51213, 51214, 51215];
const user = "postgres";
const password = "postgres";
const databases = ["template1", "postgres"];

async function tryPostgres(port, database) {
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database,
    ssl: false,
    connectionTimeoutMillis: 2000,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return { port, database, ok: true };
  } catch (e) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return { port, database, ok: false, err: e.code || e.message };
  }
}

console.log(
  `Probing ${host} ports ${ports.join(", ")} with db ${databases.join(" / ")}...\n`
);

let any = false;
for (const port of ports) {
  for (const database of databases) {
    const r = await tryPostgres(port, database);
    if (r.ok) {
      any = true;
      console.log(
        `  POSTGRES OK  ${host}:${port}  db=${database}\n     Example .env:\n     DATABASE_URL="postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=disable&pgbouncer=true"\n`
      );
    }
  }
}

console.log("");
if (!any) {
  console.log(
    "No working (port, database) pair found. Start Prisma dev (`npx prisma dev`) and run again."
  );
  process.exitCode = 1;
} else {
  console.log(
    "Prefer the pair that matches the DATABASE_URL printed by `npx prisma dev` (not SHADOW_DATABASE_URL)."
  );
}
