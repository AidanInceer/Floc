import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // Match Next's JSX runtime, so a test can import a module that holds JSX.
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Points the database at a temp file and stubs the Next.js request context
    // before any test module loads — see src/test/setup.ts (ticket 105).
    setupFiles: ["./src/test/setup.ts"],
    /**
     * Ticket 116. Thresholds are a **ratchet, not a target**: they sit just
     * under the measured baseline so coverage can only go up, and they are
     * scoped to the two areas where the bugs actually were — `lib/` (pure,
     * cheap to cover) and the Server Actions (where every critical finding in
     * the review lived). A blanket percentage across the 36 presentational
     * components would be a bigger number and a worse test suite.
     */
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["server.ts", "src/middleware.ts", "src/lib/**/*.ts", "src/server/**/*.ts", "src/app/**/actions.ts", "src/app/**/*-for.ts", "src/app/api/health/route.ts", "src/app/api/client-error/route.ts", "src/app/api/cron/push/route.ts", "src/app/api/trpc/[[]trpc]/route.ts", "src/instrumentation.ts","src/app/api/dev/enter/route.ts", "src/app/api/inbound/route.ts", "src/app/calendar/**/route.ts", "src/app/trip/*/calendar.ics/route.ts", "src/app/**/streamed.tsx", "src/app/trips/cards.ts", "src/app/not-found.tsx"],
      exclude: ["src/**/*.test.ts"],
      // At least 80% on every package; never lower one to make a run pass.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 83,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws unless the resolver picks its `react-server`
      // export, which vitest has no reason to. Under test everything *is* the
      // server, so the guard has nothing left to say (ticket 105).
      "server-only": fileURLToPath(
        new URL("./src/test/empty.ts", import.meta.url),
      ),
    },
  },
});
