import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
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
      include: ["src/lib/**/*.ts", "src/server/**/*.ts", "src/app/**/actions.ts"],
      exclude: ["src/**/*.test.ts", "src/lib/auth-client.ts"],
      // Baseline measured at v0.8.0: statements/lines 30.76%, branches 87%,
      // functions 60.95%. Re-measured at v0.10.0 after ticket 108 pulled the
      // SQL out of `app/**/actions.ts` into the `server/` aggregates, which are
      // testable without a route: 40%, 89.61%, 60.18%. Each threshold sits just
      // below its measured value — raise them when coverage rises, never lower
      // them to make a run pass.
      //
      // Functions dipped once (60.95% → 60.18%) while the code got better
      // tested: splitting long action bodies into named aggregate functions
      // adds to the denominator faster than tests cover it. It was held at 60
      // rather than cut to fit, and the aggregate suites added under tickets
      // 114/115 have since carried it past — v0.10.3 measures 45.14%, 89.74%,
      // 62.28%.
      //
      // The branches figure is high and the statements figure low for the same
      // reason: the covered modules are dense pure functions with a lot of
      // conditionals, while whole untested modules contribute no branches at
      // all. Read statements as "how much of this is exercised" and branches as
      // "how thoroughly the exercised part is".
      thresholds: {
        lines: 45,
        functions: 62,
        branches: 89,
        statements: 45,
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
