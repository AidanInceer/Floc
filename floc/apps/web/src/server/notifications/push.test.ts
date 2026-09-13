/**
 * #345: loud notifications reach a phone once, after a wait, grouped, inside
 * the limits — and a failed or doubled run never loses or repeats one.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { insertNudge } from "@/server/trips/roster";
import { openNotification } from "@/server/notifications/inbox";
import {
  forgetPushToken,
  registerPushToken,
  sendDuePushes,
  type PushMessage,
} from "@/server/notifications/push";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const minutes = (n: number) => new Date(Date.now() + n * 60_000);

const nudge = () =>
  insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "money", message: null });

function sender() {
  const sent: PushMessage[] = [];
  const send = vi.fn(async (messages: PushMessage[]) => {
    sent.push(...messages);
    return { deadTokens: [] as string[] };
  });
  return { sent, send };
}

describe("sending pushes", () => {
  it("sends nothing to someone with no phone", async () => {
    await nudge();
    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    expect(sent).toEqual([]);
  });

  it("waits, then sends once to each of the person's phones", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await registerPushToken(world.member, "ExponentPushToken[b]");
    await nudge();
    const { sent, send } = sender();

    await sendDuePushes(send, minutes(1));
    expect(sent).toEqual([]);

    await sendDuePushes(send, minutes(3));
    expect(sent.map((m) => m.to).sort()).toEqual(["ExponentPushToken[a]", "ExponentPushToken[b]"]);
    expect(sent[0]).toMatchObject({
      title: "Ours",
      body: "Ada nudged you",
      data: { href: `/trip/${world.ours.id}/money` },
    });

    await sendDuePushes(send, minutes(30));
    expect(sent).toHaveLength(2);
  });

  it("folds several into one message", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    await nudge();
    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toBe("2 new things");
    expect(sent[0].data.ids).toHaveLength(2);
  });

  it("skips what was already read", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    const [row] = await db.select().from(schema.notification).all();
    await openNotification(world.member, row.id);
    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    expect(sent).toEqual([]);
  });

  it("holds a second push inside 15 minutes and sends it later, not dropped", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    await nudge();

    await sendDuePushes(send, minutes(5));
    expect(sent).toHaveLength(1);

    await sendDuePushes(send, minutes(19));
    expect(sent).toHaveLength(2);
  });

  it("does not hand a new phone what happened before it signed up", async () => {
    await nudge();
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await db.update(schema.pushToken).set({ registeredAt: minutes(1) });
    const { sent, send } = sender();
    await sendDuePushes(send, minutes(3));
    expect(sent).toEqual([]);
  });

  it("forgets a phone Expo says is gone", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    await sendDuePushes(async () => ({ deadTokens: ["ExponentPushToken[a]"] }), minutes(3));
    const [token] = await db.select().from(schema.pushToken).all();
    expect(token.deletedAt).not.toBeNull();
  });

  it("tries again next time when the send fails", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    await expect(
      sendDuePushes(async () => Promise.reject(new Error("offline")), minutes(3)),
    ).rejects.toThrow("offline");

    const { sent, send } = sender();
    await sendDuePushes(send, minutes(4));
    expect(sent).toHaveLength(1);
  });

  it("sends once when two runs overlap", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    const { sent, send } = sender();
    await Promise.all([sendDuePushes(send, minutes(3)), sendDuePushes(send, minutes(3))]);
    expect(sent).toHaveLength(1);
  });
});

describe("push tokens", () => {
  it("moves a phone to whoever signed in on it last", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await registerPushToken(world.admin, "ExponentPushToken[a]");
    const rows = await db.select().from(schema.pushToken).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(world.admin);
  });

  it("lets only its owner forget a phone", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await forgetPushToken(world.admin, "ExponentPushToken[a]");
    const live = () =>
      db.select().from(schema.pushToken).where(eq(schema.pushToken.userId, world.member)).get();
    expect((await live())?.deletedAt).toBeNull();

    await forgetPushToken(world.member, "ExponentPushToken[a]");
    expect((await live())?.deletedAt).not.toBeNull();
  });
});
