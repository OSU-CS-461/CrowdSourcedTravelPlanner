import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 10000; // Use env or default

app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});