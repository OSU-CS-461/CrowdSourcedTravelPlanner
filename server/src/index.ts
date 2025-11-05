import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/client";

const app = express();
app.use(morgan("dev"));
app.use(cors());
const PORT = 10000;

const prisma = new PrismaClient();

app.use(express.static("public"));

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});
