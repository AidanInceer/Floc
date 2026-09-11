import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      // Screens and components need a native renderer vitest does not have.
      include: ["src/lib/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      // At least 80% on every package; never lower one to make a run pass.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
