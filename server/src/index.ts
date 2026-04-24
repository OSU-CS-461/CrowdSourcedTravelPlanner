import "./env.js";
import app from "./app";
import prisma from "./db/prisma";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 10000;
  try {
    await prisma.$connect();
  } catch {
    // Non-fatal: server will still start, first request may be slower
  }
  app.listen(PORT, () => {
    console.log(`App listening on http://localhost:${PORT}`);
  });
}

if (process.argv[1] === __filename) {
  startServer();
}
