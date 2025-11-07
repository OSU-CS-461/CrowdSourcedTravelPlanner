import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{tests,specs}.?(c|m)[jt]s?(x)"],
    environment: "node",
  },
});
