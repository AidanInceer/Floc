import { createClient } from "@libsql/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { sendDueEmails } from "@/server/notifications/email-fallback";
import { registerPushToken, sendDuePushes, type PushMessage } from "@/server/notifications/push";
import { insertNudge } from "@/server/trips/nudges";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.update(schema.user).set({ emailVerified: true });
});

const minutes = (n: number) => new Date(Date.now() + n * 60_000);

const nudge = () =>
  insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "money" });

function sender() {
  const sent: PushMessage[] = [];
  const send = vi.fn(async (messages: PushMessage[]) => {
    sent.push(...messages);
    return { deadTokens: [] as string[] };
  });
  return { sent, send };
}

type Statement = { sql: string; args: unknown[] };

async function planOf(run: () => Promise<unknown>): Promise<string[]> {
  const execute = vi.spyOn(db.$client, "execute");
  await run();
  const statements = execute.mock.calls.map(([statement]) => statement as unknown as Statement);
  execute.mockRestore();
  const due = statements.find((s) => typeof s.sql === "string" && s.sql.includes("recipient_alerts"));
  if (!due) throw new Error("The cron ran no query for what is due");
  const reader = createClient({ url: process.env.TURSO_DATABASE_URL! });
  try {
    const plan = await reader.execute({ sql: `explain query plan ${due.sql}`, args: due.args as never });
    return plan.rows.map((row) => String(row.detail));
  } finally {
    reader.close();
  }
}

const readsAllHistory = (step: string) => /^SCAN (notification|activity)\b(?!_)/.test(step);

describe("what the cron reads", () => {
  it("finds due pushes through the waiting deliveries, never by reading every notification", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    const steps = await planOf(() => sendDuePushes(sender().send, minutes(3)));

    expect(steps.join("\n")).toContain("notification_delivery_waiting_idx");
    expect(steps.filter(readsAllHistory)).toEqual([]);
  });

  it("finds due emails the same way", async () => {
    await nudge();
    const steps = await planOf(() => sendDueEmails(vi.fn(), minutes(11)));

    expect(steps.join("\n")).toContain("notification_delivery_waiting_idx");
    expect(steps.filter(readsAllHistory)).toEqual([]);
  });
});
