import { randomBytes } from "node:crypto";

import { checkApplication, checkGoogleSecret, checkStripeKey, checkWebhook, checkWebhookEndpoint, checkWebhookFormat } from "./checks.ts";
import { GENERATED, readPlan, type Plan } from "./plan.ts";
import type { Railway, Service } from "./railway.ts";
import { tokenExpiration, type Turso } from "./turso.ts";

export type Supplied = { turso?: Turso; GOOGLE_CLIENT_SECRET?: string; STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string };
type Progress = { step: number; label: string; state: "start" | "done" | "status"; detail?: string };
type Deps = { railway: Railway; fetcher?: typeof fetch; wait?: () => Promise<void>; progress?: (event: Progress) => void };

export const STEPS = ["Check new values", "Write Railway variables", "Replace Turso token", "Deploy floc-web", "Deploy floc-cron", "Check floc.live"];

const pause = () => new Promise<void>((done) => setTimeout(done, 10_000));

async function validate(plan: Plan, supplied: Supplied, fetcher: typeof fetch) {
  if (supplied.STRIPE_SECRET_KEY) await checkStripeKey(plan.web.STRIPE_SECRET_KEY, supplied.STRIPE_SECRET_KEY, fetcher);
  if (supplied.STRIPE_WEBHOOK_SECRET) {
    checkWebhookFormat(supplied.STRIPE_WEBHOOK_SECRET);
    await checkWebhookEndpoint(supplied.STRIPE_SECRET_KEY ?? plan.web.STRIPE_SECRET_KEY, fetcher);
  }
  if (supplied.GOOGLE_CLIENT_SECRET) await checkGoogleSecret(plan.web.GOOGLE_CLIENT_ID, supplied.GOOGLE_CLIENT_SECRET, fetcher);
  if (!supplied.turso) return null;
  await supplied.turso.assertScope(plan.web.TURSO_DATABASE_URL);
  return tokenExpiration(plan.web.TURSO_AUTH_TOKEN);
}

async function deploy(railway: Railway, service: Service, wait: () => Promise<void>, status: (detail: string) => void) {
  const deployment = await railway.deploy(service);
  let last = "";
  for (let attempt = 0; attempt < 90; attempt++) {
    const current = await railway.status(deployment);
    if (current !== last) status(current);
    last = current;
    if (current === "SUCCESS" || current === "SLEEPING") return;
    if (["FAILED", "CRASHED", "REMOVED", "SKIPPED"].includes(current)) throw new Error(`Deploy ended ${current}. Read its logs in Railway, then run again.`);
    await wait();
  }
  throw new Error("Deploy still running after 15 minutes. Check Railway, then run again.");
}

export async function applyRotation(supplied: Supplied, { railway, fetcher = fetch, wait = pause, progress = () => {} }: Deps) {
  const run = async <T>(step: number, work: (status: (detail: string) => void) => Promise<T>, skip?: string) => {
    if (skip) return progress({ step, label: STEPS[step], state: "done", detail: skip });
    progress({ step, label: STEPS[step], state: "start" });
    const result = await work((detail) => progress({ step, label: STEPS[step], state: "status", detail }));
    progress({ step, label: STEPS[step], state: "done" });
    return result;
  };
  const plan = await readPlan(railway);
  const expiration = await run(0, () => validate(plan, supplied, fetcher));

  const generated = Object.fromEntries(GENERATED.map((name) => [name, randomBytes(48).toString("base64url")]));
  const pasted = Object.fromEntries(plan.pasted.filter((name) => supplied[name]).map((name) => [name, supplied[name]!]));
  await run(1, async () => {
    await railway.upsert("web", { ...generated, ...pasted });
    if (!plan.cronFollowsWeb) await railway.upsert("cron", { CRON_SECRET: generated.CRON_SECRET });
  });
  await run(2, async () => {
    const token = await supplied.turso!.replaceToken(expiration!, plan.web.TURSO_DATABASE_URL);
    await railway.upsert("web", { TURSO_AUTH_TOKEN: token });
  }, supplied.turso && expiration ? undefined : "skipped");
  await run(3, (status) => deploy(railway, "web", wait, status));
  await run(4, (status) => deploy(railway, "cron", wait, status));
  await run(5, async () => {
    await checkApplication(fetcher);
    if (pasted.STRIPE_WEBHOOK_SECRET) await checkWebhook(pasted.STRIPE_WEBHOOK_SECRET, fetcher);
  });
  return [...GENERATED, ...Object.keys(pasted), ...(expiration ? ["TURSO_AUTH_TOKEN"] : [])];
}
