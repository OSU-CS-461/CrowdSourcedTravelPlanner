import "dotenv/config";
import morgan from "morgan";
import cors from "cors";
import app from "./app";

app.use(morgan("dev"));
app.use(cors());
const PORT = 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});
