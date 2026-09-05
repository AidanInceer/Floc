import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    /**
     * The `lib/` half of the app's coverage ratchet (#116), carried over with
     * the code (#286). Thresholds sit just under the measured figure so
     * coverage can only go up; never lower one to make a run pass.
     */
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      // Baselined at the carve-out: measured 92.38 / 94.66 / 96.64 / 92.38.
      thresholds: { lines: 92, functions: 94, branches: 96, statements: 92 },
    },
  },
});
