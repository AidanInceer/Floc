import type { Railway } from "./railway.ts";

export const GENERATED = ["BETTER_AUTH_SECRET", "CRON_SECRET"] as const;
const PASTED = ["GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;
const HANDLED = [...GENERATED, ...PASTED, "TURSO_AUTH_TOKEN"];
const UNUSED = ["NEXT_PUBLIC_MAPTILER_KEY"];
const NOT_SECRET = ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];

const secretName = (name: string) => !NOT_SECRET.includes(name) && (/(?:SECRET|TOKEN|KEY|PASSWORD|CREDENTIALS)$/.test(name));
const reference = (value: string | undefined) => Boolean(value?.includes("${{"));

export type Plan = Awaited<ReturnType<typeof readPlan>>;

export async function readPlan(railway: Pick<Railway, "findTarget" | "variables">) {
  const target = await railway.findTarget();
  const web = await railway.variables("web");
  const cron = await railway.variables("cron");
  if (web.BETTER_AUTH_URL !== "https://floc.live") throw new Error("floc-web BETTER_AUTH_URL is not https://floc.live; review the target.");
  for (const name of HANDLED) {
    if (reference(web[name])) throw new Error(`${name} on floc-web is a variable reference; set it by hand.`);
  }
  for (const name of GENERATED) {
    if (!web[name]) throw new Error(`${name} is missing on floc-web.`);
  }
  const names = [...new Set([...Object.keys(web), ...Object.keys(cron)])].filter(secretName).sort((a, b) => a.localeCompare(b));
  return {
    target: target.name, web, cron,
    cronFollowsWeb: reference(cron.CRON_SECRET),
    pasted: PASTED.filter((name) => web[name]),
    turso: Boolean(web.TURSO_AUTH_TOKEN),
    unused: names.filter((name) => UNUSED.includes(name)),
    other: names.filter((name) => !HANDLED.includes(name) && !UNUSED.includes(name)),
  };
}
