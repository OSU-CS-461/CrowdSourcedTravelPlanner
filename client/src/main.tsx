import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if (import.meta.env.DEV) {
  console.log("Is dev mode");
  console.log(import.meta.env);
} else {
  console.log("Is prod mode");
  console.log(import.meta.env);
}

createRoot(document.getElementById("root")!).render(<App />);
