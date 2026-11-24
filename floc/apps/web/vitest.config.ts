import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["server.ts", "src/middleware.ts", "src/lib/**/*.ts", "src/server/**/*.ts", "src/app/**/actions.ts", "src/app/**/*-for.ts", "src/app/api/health/route.ts", "src/app/api/client-error/route.ts", "src/app/api/cron/push/route.ts", "src/app/api/trpc/[[]trpc]/route.ts", "src/instrumentation.ts", "src/app/api/dev/enter/route.ts", "src/app/api/inbound/route.ts", "src/app/api/media/**/route.ts", "src/app/calendar/**/route.ts", "src/app/trip/*/calendar.ics/route.ts", "src/app/trip/*/recap-card/route.tsx", "src/app/**/next-trip-actions.ts", "src/app/**/estimate-actions.ts", "src/app/invite/*/invite-access.ts", "src/app/invite/*/join/route.ts", "src/app/**/streamed.tsx", "src/app/trips/cards.ts", "src/app/not-found.tsx", "src/app/robots.txt/route.ts", "src/app/sitemap.xml/route.ts", "src/app/api/analytics/route.ts", "src/app/api/billing/checkout/route.ts", "src/app/api/billing/portal/route.ts", "src/app/trip/*/notes-actions.ts", "src/app/api/mcp/route.ts", "src/app/.well-known/oauth-protected-resource/api/mcp/route.ts", "src/app/.well-known/oauth-authorization-server/api/auth/route.ts", "src/app/.well-known/openid-configuration/api/auth/route.ts"],
      exclude: ["src/**/*.test.ts"],
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
      "server-only": fileURLToPath(
        new URL("./src/test/empty.ts", import.meta.url),
      ),
    },
  },
});
