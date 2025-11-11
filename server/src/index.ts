import "dotenv/config";
import app from "./app";


import { PrismaClient } from './generated/prisma/client';
const prisma = new PrismaClient();

// --- Routers ---



import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  const PORT = 10000;
  app.listen(PORT, () => {
    console.log(`App listening on http://localhost:${PORT}`);
  });
}
