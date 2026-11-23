import { createClient, type InArgs, type InStatement } from "@libsql/client";
import { afterAll, beforeAll, it, vi } from "vitest";

import { db } from "@/db";
import { purgeOldGuests } from "@/server/guests/guest-purge";
import { sendDueEmails } from "@/server/notifications/email-fallback";
import { sendDuePushes } from "@/server/notifications/push";
import { sendDueReminders } from "@/server/notifications/reminders";
import { migrateTestDb } from "@/test/db";

vi.hoisted(() => {
  process.env.TURSO_DATABASE_URL = `file:${process.env.FLOC_SCALE_DB}`;
});

const PEOPLE = 300_000;
const TRIPS = 120_000;
const MEMBERS_PER_TRIP = 5;
const ACTIVITY = 1_000_000;
const NOTIFICATIONS = 4_000_000;
const DAY_SECONDS = 86_400;
const SENT_SPREAD_DAYS = 365;
const OLD_GUESTS = 10;
const RECENT_GUESTS = 1_000;

const today = new Date();
const NOW = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 9));
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

const spreadOver = (count: number) => `(i * ${SENT_SPREAD_DAYS * DAY_SECONDS} / ${count})`;

const numbers = (count: number) => `with recursive n(i) as (select 0 union all select i + 1 from n where i + 1 < ${count})`;

const LOAD: [string, string][] = [
  ["people", `${numbers(PEOPLE)} insert into user (id, name, email, is_anonymous, created_at, updated_at)
    select 'u' || i, 'Person ' || i, 'u' || i || '@scale.test',
      i < ${OLD_GUESTS + RECENT_GUESTS},
      ${NOW_SECONDS} - case when i < ${OLD_GUESTS} then 30 * ${DAY_SECONDS} when i < ${OLD_GUESTS + RECENT_GUESTS} then ${DAY_SECONDS} else i end,
      ${NOW_SECONDS} from n`],
  ["trips", `${numbers(TRIPS)} insert into trip (id, name, created_by, invite_token, start_date, end_date)
    select i + 1, 'Trip ' || i, 'u' || (${OLD_GUESTS + RECENT_GUESTS} + i), 'scale-' || i,
      date(${NOW_SECONDS} - 800 * ${DAY_SECONDS} + (i % 1000) * ${DAY_SECONDS}, 'unixepoch'),
      date(${NOW_SECONDS} - 795 * ${DAY_SECONDS} + (i % 1000) * ${DAY_SECONDS}, 'unixepoch') from n`],
  ["memberships", `${numbers(TRIPS * MEMBERS_PER_TRIP)} insert into trip_membership (trip_id, user_id, role)
    select (i / ${MEMBERS_PER_TRIP}) + 1, 'u' || (${OLD_GUESTS + RECENT_GUESTS} + ((i / ${MEMBERS_PER_TRIP}) * 7 + (i % ${MEMBERS_PER_TRIP}) * 13) % ${PEOPLE - OLD_GUESTS - RECENT_GUESTS}), 'member' from n`],
  ["activity", `${numbers(ACTIVITY)} insert into activity (id, trip_id, actor_id, kind, subject_id, href, created_at, last_modified_at)
    select i + 1, (i % ${TRIPS}) + 1, 'u' || (${OLD_GUESTS + RECENT_GUESTS} + i % 1000), 'nudge_sent', (i % ${TRIPS}) + 1, '/trip',
      ${NOW_SECONDS} - ${spreadOver(ACTIVITY)}, ${NOW_SECONDS} - ${spreadOver(ACTIVITY)} from n`],
  ["notifications", `${numbers(NOTIFICATIONS)} insert into notification (id, activity_id, user_id, loud, created_at, last_modified_at)
    select i + 1, (i % ${ACTIVITY}) + 1, 'u' || (${OLD_GUESTS + RECENT_GUESTS} + ((i % ${ACTIVITY}) * 11 + (i / ${ACTIVITY}) * 17) % ${PEOPLE - OLD_GUESTS - RECENT_GUESTS}), i % 4 = 0,
      ${NOW_SECONDS} - ${spreadOver(NOTIFICATIONS)}, ${NOW_SECONDS} - ${spreadOver(NOTIFICATIONS)} from n`],
  ["deliveries", `insert into notification_delivery (notification_id, channel, sent_at, created_at, last_modified_at)
    select notification.id, channels.value,
      case when notification.id % 1000 = 1 then null else notification.created_at end,
      notification.created_at, notification.created_at
    from notification, json_each('["push","email"]') as channels where notification.loud = 1`],
];

type Timing = { sql: string; args: InArgs | undefined; ms: number[] };

function timeStatements(): Map<string, Timing> {
  const client = db.$client;
  const seen = new Map<string, Timing>();
  const execute = client.execute.bind(client) as (statement: InStatement) => ReturnType<typeof client.execute>;
  vi.spyOn(client, "execute").mockImplementation((async (statement: InStatement) => {
    const started = performance.now();
    const result = await execute(statement);
    if (typeof statement !== "string" && /^\s*select/i.test(statement.sql)) {
      const entry = seen.get(statement.sql) ?? { sql: statement.sql, args: statement.args, ms: [] };
      entry.ms.push(performance.now() - started);
      seen.set(statement.sql, entry);
    }
    return result;
  }) as typeof client.execute);
  return seen;
}

function nameOf(sql: string): string {
  if (/from "notification_delivery" inner join "notification"/.test(sql)) return "sent today";
  if (/from "notification" inner join "activity"/.test(sql)) return "due";
  return sql.replace(/\s+/g, " ").replace(/^select .*? from /i, "from ").slice(0, 70);
}

async function report(timings: Map<string, Timing>) {
  const reader = createClient({ url: process.env.TURSO_DATABASE_URL! });
  const rows = [];
  for (const { sql, args, ms } of timings.values()) {
    const plan = await reader.execute({ sql: `explain query plan ${sql}`, args: args ?? [] });
    const scans = plan.rows.map((r) => String(r.detail)).filter((d) => d.startsWith("SCAN"));
    rows.push({
      query: nameOf(sql),
      calls: ms.length,
      slowestMs: Number(Math.max(...ms).toFixed(2)),
      scans: scans.join("; ").slice(0, 60),
    });
  }
  reader.close();
  console.table(rows.sort((a, b) => b.slowestMs - a.slowestMs).slice(0, 25));
}

beforeAll(async () => {
  await migrateTestDb();
  await db.$client.execute("PRAGMA foreign_keys = OFF");
  for (const [name, statement] of LOAD) {
    const started = performance.now();
    await db.$client.execute(statement);
    console.log(`loaded ${name} in ${((performance.now() - started) / 1000).toFixed(1)} s`);
  }
  await db.$client.execute("PRAGMA foreign_keys = ON");
});

afterAll(() => {
  vi.restoreAllMocks();
  db.$client.close();
});

it("prints the time and plan of each cron query at scale", async () => {
  const timings = timeStatements();
  await sendDueReminders(NOW);
  await sendDuePushes(async () => ({ deadTokens: [] }), NOW);
  await sendDueEmails(async () => [], NOW);
  await purgeOldGuests(NOW);
  vi.restoreAllMocks();
  await report(timings);
});
