import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import type { OutboundEmail } from "@/server/auth/email";
import { insertNudge } from "@/server/trips/nudges";
import { saveAlertSettings } from "@/server/notifications/alert-settings";
import { sendDueEmails } from "@/server/notifications/email-fallback";
import { registerPushToken, sendDuePushes } from "@/server/notifications/push";
import { recordActivity } from "@/server/notifications/activity";
import { sendDueReminders } from "@/server/notifications/reminders";

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

function mailer() {
  const sent: OutboundEmail[] = [];
  const send = vi.fn(async (emails: OutboundEmail[]) => {
    sent.push(...emails);
  });
  return { sent, send };
}

const setProfile = saveAlertSettings;

describe("the email fallback", () => {
  it("waits, then emails someone with no phone, linking to the thing", async () => {
    await nudge();
    const { sent, send } = mailer();

    await sendDueEmails(send, minutes(5));
    expect(sent).toEqual([]);

    await sendDueEmails(send, minutes(11));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: `${world.member}@example.test`,
      subject: "Ada nudged you to settle up on the trip Ours",
      cta: { url: expect.stringMatching(new RegExp(`/trip/${world.ours.id}/money$`)) },
    });

    await sendDueEmails(send, minutes(90));
    expect(sent).toHaveLength(1);
  });

  it("draws it as a letter about its trip, linking to the setting that stops it (#653)", async () => {
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    expect(sent[0]).toMatchObject({
      layout: "letter",
      trip: { name: "Ours" },
      settingsUrl: expect.stringContaining("#settings-notifications"),
    });
  });

  it("emails a reminder, which nobody did, with no face beside it (#653)", async () => {
    await db.update(schema.trip).set({ startDate: "2026-09-20", endDate: "2026-09-22" }).where(eq(schema.trip.id, world.ours.id));
    await sendDueReminders(new Date("2026-09-13T09:00:00Z"));
    const { sent, send } = mailer();
    await sendDueEmails(send, new Date(Date.now() + 365 * 86_400_000));
    const mine = sent.find((m) => m.to === `${world.member}@example.test`);
    expect(mine).toMatchObject({ subject: "Ours starts in a week", layout: "letter" });
    expect(mine?.rows).toBeUndefined();
  });

  it("never emails an address its account has not confirmed: anyone can sign up with someone else's", async () => {
    await db.update(schema.user).set({ emailVerified: false }).where(eq(schema.user.id, world.member));
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    expect(sent).toEqual([]);
  });

  it("never emails what a phone will get", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    expect(sent).toEqual([]);
  });

  it("emails instead of pushing when push is switched off", async () => {
    await registerPushToken(world.member, "ExponentPushToken[a]");
    await setProfile(world.member, { notifyPush: false });
    await nudge();

    const pushes = vi.fn(async () => ({ deadTokens: [] as string[] }));
    await sendDuePushes(pushes, minutes(11));
    expect(pushes).not.toHaveBeenCalled();

    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    expect(sent).toHaveLength(1);
  });

  it("sends nothing when email is switched off", async () => {
    await setProfile(world.member, { notifyEmail: false });
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    expect(sent).toEqual([]);
  });

  it("sends nothing from a muted trip, and the inbox still has it", async () => {
    await db
      .update(schema.tripMembership)
      .set({ mutedAt: new Date() })
      .where(eq(schema.tripMembership.userId, world.member));
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    expect(sent).toEqual([]);
    expect(await db.select().from(schema.notification).all()).toHaveLength(1);
  });

  it("holds a second email inside the hour, then sends it", async () => {
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    await db.update(schema.activity).set({ lastModifiedAt: new Date(Date.now() - 60 * 60_000) });
    await insertNudge({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, tab: "dates" });

    await sendDueEmails(send, minutes(30));
    expect(sent).toHaveLength(1);

    await sendDueEmails(send, minutes(72));
    expect(sent).toHaveLength(2);
  });

  it("sends a trip invite inside the hour that holds other mail for the trip", async () => {
    await nudge();
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(11));
    await db.insert(schema.tripInvite).values({ tripId: world.ours.id, fromUserId: world.admin, toUserId: world.member, status: "pending" });
    await db.transaction((tx) =>
      recordActivity(tx, { kind: "trip_invited", tripId: world.ours.id, actorId: world.admin, subjectId: null, href: "/trips", affected: [world.member] }),
    );
    await db.update(schema.activity).set({ lastModifiedAt: new Date(Date.now() - 60 * 60_000) });

    await sendDueEmails(send, minutes(30));
    expect(sent.map((m) => m.subject)).toEqual(["Ada nudged you to settle up on the trip Ours", "Ada invited you to Ours"]);
  });

  it("sends once when two runs overlap", async () => {
    await nudge();
    const { sent, send } = mailer();
    await Promise.all([sendDueEmails(send, minutes(11)), sendDueEmails(send, minutes(11))]);
    expect(sent).toHaveLength(1);
  });

  it("tries again next time when the send fails", async () => {
    await nudge();
    await expect(sendDueEmails(async () => Promise.reject(new Error("offline")), minutes(11))).rejects.toThrow("offline");
    const { sent, send } = mailer();
    await sendDueEmails(send, minutes(12));
    expect(sent).toHaveLength(1);
  });
});
