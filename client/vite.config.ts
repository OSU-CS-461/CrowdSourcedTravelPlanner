import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    include: ["**/*.{test,spec,tests}.?(c|m)[jt]s?(x)"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.*",
        "src/**/*.tests.*",
        "src/**/*.spec.*",
        "src/**/*.specs.*",
        "src/**/__tests__/**",
        "src/test/**",
      ],
      reporter: ["text", "lcov", "json-summary"],
    },
  },
})
