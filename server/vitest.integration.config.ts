import { defineConfig } from "vitest/config";

// Integration tests will use the vitest.setup to setup a test db for each spec.
// Non-integration tests should be mocking out prisma all together.

const INCLUDED_INTEGRATION_TEST_PATHS = [
  "src/__tests__/controllers/**/*.tests.ts",
  "src/__tests__/db/**/*.tests.ts",
];

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.integration.setup.ts"],
    include: [...INCLUDED_INTEGRATION_TEST_PATHS],
    coverage: {
      include: [...INCLUDED_INTEGRATION_TEST_PATHS],
    },
  },
});
