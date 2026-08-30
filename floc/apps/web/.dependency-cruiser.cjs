/**
 * Layer rules, installed while the layering is already clean (#212) — this is
 * a ratchet, not a repair.
 *
 * Type-only imports stay legal everywhere: they vanish at build time, so they
 * cost nothing at runtime and the code already relies on them.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "A cycle means neither module can be understood on its own.",
      from: {},
      to: { circular: true },
    },
    {
      name: "lib-stays-pure",
      severity: "error",
      comment:
        "src/lib is pure and testable without a request. It may describe " +
        "types from elsewhere but must not pull the server, the routes or " +
        "the components in behind it.",
      from: { path: "^src/lib/" },
      to: {
        path: "^src/(server|app|components)/",
        dependencyTypesNot: ["type-only"],
      },
    },
    {
      name: "only-server-opens-the-database",
      severity: "error",
      comment:
        "src/db/index.ts is the drizzle client — the door to SQL. Only " +
        "server/ aggregates go through it; app/ and components/ read what " +
        "those return. Tests are exempt: they need a real database. " +
        "db/schema.ts is not covered — it also holds the shared vocabulary " +
        "constants (CURRENCIES, VISIBILITIES) that the UI legitimately reads.",
      from: { path: "^src/(app|components)/", pathNot: "\.test\.ts$" },
      to: { path: "^src/db/index\.ts$" },
    },
    {
      name: "freshness-owns-the-cache",
      severity: "error",
      comment:
        "src/server/freshness.ts is the only place that maps a changed fact " +
        "to the pages it makes stale (ticket 241). A revalidatePath call " +
        "anywhere else re-scatters that knowledge, and the next page added " +
        "over shared data goes stale with nothing to catch it. Announce the " +
        "fact with `refresh` instead. src/test/ is exempt — setup.ts mocks " +
        "the module so a write in a test never reaches Next's cache.",
      from: { pathNot: "^src/(server/freshness\.ts|test/)" },
      to: { path: "node_modules/next/cache\.js$" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(\.next|coverage|drizzle)/" },
    tsPreCompilationDeps: "specify",
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
