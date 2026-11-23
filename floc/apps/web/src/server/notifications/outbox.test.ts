import { readFileSync } from "node:fs";

import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
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

describe("the move of send records out of the inbox row", () => {
  const copy = readFileSync("./drizzle/0077_complex_morlun.sql", "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.startsWith("INSERT"));

  async function moveAgain() {
    await db.delete(schema.notificationDelivery);
    for (const statement of copy) await db.run(sql.raw(statement));
  }

  it("copies a row for each channel", () => {
    expect(copy).toHaveLength(2);
  });

  it("does not push again what was pushed before the move", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    await db.update(schema.notification).set({ retiredPushedAt: new Date() });
    await moveAgain();

    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    expect(sent).toEqual([]);
  });

  it("still pushes what was waiting before the move, once", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    await moveAgain();

    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    await sendDuePushes(send, minutes(30));
    expect(sent).toHaveLength(1);
  });

  it("keeps a push another worker had claimed out of this run", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    await db.update(schema.notification).set({ retiredPushClaimedAt: minutes(2) });
    await moveAgain();

    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    expect(sent).toEqual([]);
  });
});
