import { defineConfig } from "vitest/config";

const EXCLUDED_INTEGRATION_TEST_PATHS = [
  "src/__tests__/controllers/**/*.tests.ts",
  "src/__tests__/db/**/*.tests.ts",
];

export default defineConfig({
  test: {
    include: ["**/*.{tests,specs}.?(c|m)[jt]s?(x)"],
    exclude: [...EXCLUDED_INTEGRATION_TEST_PATHS],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      include: ["src/models/**", "src/services/**"],
    },
  },
});
