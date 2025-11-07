import express, { Request, Response } from "express";
import prisma from "./db/prisma";
import path from "path";
import { register } from "./controllers/authController";
// import cookieParser from "cookie-parser";

const app = express();

app.use(express.static("public"));
app.use(express.json()); // parses JSON bodies
app.use(express.urlencoded({ extended: true })); // optional: handle form-encoded data
// app.use(cookieParser());

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
    // await prisma.user.create({});
  }
  const users = await prisma.user.findMany();
  res.json({ users });
});

app.post("/api/auth/register", register);

export default app;
