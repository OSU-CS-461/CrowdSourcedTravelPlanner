import "dotenv/config";
import app from "./app";
import prisma from "./db/prisma";

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

startServer();
