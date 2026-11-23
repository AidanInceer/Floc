import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import base from "../../vitest.config";

const HOUR_MS = 3_600_000;

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: base.resolve,
  test: {
    globals: true,
    environment: "node",
    include: ["scripts/perf/cron-scale.scale.ts"],
    setupFiles: ["./src/test/setup.ts"],
    globalSetup: [fileURLToPath(new URL("./cron-scale.global.ts", import.meta.url))],
    testTimeout: HOUR_MS,
    hookTimeout: HOUR_MS,
    fileParallelism: false,
  },
});
