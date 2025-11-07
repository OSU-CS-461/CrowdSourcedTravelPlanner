/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["**/*.{tests,specs}.?(c|m)[jt]s?(x)"],
    environment: "node",
  },
});
