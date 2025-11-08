import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/client";

// ---- Create the app ----

export const app = express();

// ---- Middleware ----

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

const prisma = new PrismaClient();

app.use(express.static("public"));

// --- Endpoints ---

import { default as experienceRouter } from './routes/experiences';
app.use('/experiences', experienceRouter);


app.get("/", (req: Request, res: Response) => {
  const spaFilePath = path.resolve(__dirname, "..", "public");
  res.sendFile(spaFilePath);
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

app.get("/api/users", async (req: Request, res: Response) => {
  const userCount = await prisma.user.count();
  if (userCount < 10) {
    // create empty user
    await prisma.user.create({});
  }
  const users = await prisma.user.findMany();
  res.json({ users });
});


// Only start server if this file is run directly 
// (Allows for testing with supertest)
if (require.main === module) {
  const PORT = 10000;
  app.listen(PORT, () => {
    console.log(`App listening on http://localhost:${PORT}`);
  });
}