import express, { Request, Response } from "express";
import path from "path";
import { register } from "./controllers/authController";
import { Routes } from "./routes";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware";
// import cookieParser from "cookie-parser";

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  const spaFilePath = path.resolve(__dirname, "..", "public");
  res.sendFile(spaFilePath);
});

app.post(Routes.POST__AUTH_REGISTER, register);

app.use(errorHandlerMiddleware);

export default app;
