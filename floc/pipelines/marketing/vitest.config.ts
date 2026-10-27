import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["src/**/*.ts"],
      // Why: these drive real processes (argv and stdin; Chromium and ffmpeg; a listening server) and hold no rules.
      exclude: ["src/**/*.test.ts", "src/cli.ts", "src/render.ts", "src/studio.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
