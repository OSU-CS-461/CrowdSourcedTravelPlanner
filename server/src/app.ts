import express, { Request, Response } from "express";
import path from "path";
import { login, register } from "./controllers/authController";
import { Routes } from "./routes";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware";

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  const spaFilePath = path.resolve(__dirname, "..", "public");
  res.sendFile(spaFilePath);
});

app.post(Routes.POST__AUTH_REGISTER, register);
app.post(Routes.POST__AUTH_LOGIN, login);

app.use(errorHandlerMiddleware);

export default app;
