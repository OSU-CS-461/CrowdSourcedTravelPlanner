import express, { Request, Response } from "express";
import path from "path";
import { login, register } from "./controllers/authController";
import { Routes } from "./routes";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware";
import morgan from "morgan";
import cors from "cors";
import { default as experienceRouter } from "./routers/experience";
import { default as tagRouter } from "./routers/tag";
import { default as categoryRouter } from "./routers/category";
import { default as geocodeRouter } from "./routers/geocode";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Routers ----

app.get("/", (req: Request, res: Response) => {
  const spaFilePath = path.resolve(__dirname, "..", "public");
  res.sendFile(spaFilePath);
});

app.use("/api/experiences", experienceRouter);
app.use("/api/tags", tagRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/geocode", geocodeRouter);


app.post(Routes.POST__AUTH_REGISTER, register);
app.post(Routes.POST__AUTH_LOGIN, login);

app.use(errorHandlerMiddleware);

export default app;
