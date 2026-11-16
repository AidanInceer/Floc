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
const body = (await response.text()).replace(/[\r\n]+/g, " ");
if (!response.ok) {
  console.error(`[cron-push] ${response.status} ${body}`);
  process.exit(1);
}
console.log(`[cron-push] ${body}`);
