import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{tests,specs}.?(c|m)[jt]s?(x)"],
    exclude: [
      "src/__tests__/controllers/**/*.tests.ts",
      "src/__tests__/db/**/*.tests.ts",
    ],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
