import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    /**
     * The editor's logic — schema, commands, what a line shows — runs on a
     * ProseMirror state with no browser, and is tested that way. What needs a
     * renderer (`.tsx`, the view plugins) is walked in the browser instead.
     */
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/testing.ts", "src/view/**"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
