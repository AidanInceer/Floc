import { vi } from "vitest";

import type { Railway, Service } from "./railway";

export function webVariables(overrides: Record<string, string> = {}) {
  return {
    BETTER_AUTH_URL: "https://floc.live", BETTER_AUTH_SECRET: "old-auth", CRON_SECRET: "old-cron",
    GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "old-google",
    STRIPE_SECRET_KEY: "sk_live_old", STRIPE_WEBHOOK_SECRET: "whsec_old", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
    TURSO_DATABASE_URL: "libsql://app-team.turso.io", TURSO_AUTH_TOKEN: `h.${Buffer.from("{}").toString("base64url")}.s`,
    NEXT_PUBLIC_MAPTILER_KEY: "old-map", ...overrides,
  };
}

export function fakeRailway(web = webVariables(), cron: Record<string, string> = { BETTER_AUTH_URL: "https://floc.live", CRON_SECRET: "old-cron" }) {
  const statuses: string[] = [];
  const railway = {
    findTarget: vi.fn(async () => ({ name: "app", project: "p", environment: "e", web: "w", cron: "c" })),
    variables: vi.fn(async (service: Service) => (service === "web" ? web : cron)),
    upsert: vi.fn<(service: Service, variables: Record<string, string>) => Promise<void>>(async () => {}),
    deploy: vi.fn(async (service: Service) => `dep-${service}`),
    status: vi.fn(async () => statuses.shift() ?? "SUCCESS"),
  } satisfies Railway;
  return { railway, statuses };
}
