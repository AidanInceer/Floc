/**
 * The Railway cron service's command, every 5 minutes (#345):
 * `node floc/apps/web/scripts/cron-push.mjs`. It only knocks; the web service
 * does the work, so the cron needs no database access.
 */
const url = process.env.BETTER_AUTH_URL;
const secret = process.env.CRON_SECRET;
if (!url || !secret) {
  console.error("[cron-push] BETTER_AUTH_URL and CRON_SECRET must both be set.");
  process.exit(1);
}

const response = await fetch(new URL("/api/cron/push", url), {
  method: "POST",
  headers: { authorization: `Bearer ${secret}` },
});
const body = await response.text();
if (!response.ok) {
  console.error(`[cron-push] ${response.status} ${body}`);
  process.exit(1);
}
console.log(`[cron-push] ${body}`);
