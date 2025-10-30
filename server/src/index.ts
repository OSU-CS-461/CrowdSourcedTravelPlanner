import express, { Request, Response } from "express";
import path from "path";

const app = express();
const port = 10000;

app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  const spaFilePath = path.resolve(__dirname, "..", "public");
  console.log(spaFilePath);
  res.sendFile(spaFilePath);
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
