import "dotenv/config";
import app from "./app";

const PORT = 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});
