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
      // A ratchet: each threshold sits just under the measured figure, so
      // coverage can only go up. Raise them when it rises; never lower one to
      // make a run pass.
      //
      // Statements read as "how much of this is exercised", branches as "how
      // thoroughly the exercised part is" — which is why one is low and the
      // other high over the same code.
      //
      // Re-baselined at the floc-core carve-out (#286, measured 58.82 / 78.38
      // / 84.29 / 58.82). The figures fell because `lib/` — pure and cheaply
      // covered — left for its own package, which now carries the higher
      // ratchet. Nothing became less tested: the same tests run, across two
      // packages instead of one.
      //
      // Branches dropped a point again when the idea board was removed: its
      // actions were the most heavily branch-tested thing in `app/`, and
      // deleting tested code moves the ratio without untesting anything.
      thresholds: {
        lines: 58,
        functions: 78,
        branches: 83,
        statements: 58,
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
