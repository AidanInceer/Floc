import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { insertNudge } from "@/server/trips/nudges";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const nudge = (tab: "dates" | "money" = "dates") =>
  insertNudge({
    tripId: world.ours.id,
    fromUserId: world.admin,
    toUserId: world.member,
    tab,
  });

describe("the notifications port", () => {
  it("lists a page, naming the person and the trip, with the time as a string", async () => {
    await nudge();
    const page = await webPort.listNotifications(world.member, null);

    expect(page.next).toBeNull();
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ text: "Ada nudged you to mark your days on the trip Ours", read: false, loud: true });
    expect(typeof page.items[0].at).toBe("string");
  });

  it("hands the phone a plan change with its trip and its note", async () => {
    await webPort.addEvent(world.admin, world.ours.id, world.ours.dayId, { type: "activity", title: "Benagil caves", transportType: null, time: "10:30", endTime: null, allDay: false, note: null });
    const [item] = (await webPort.listNotifications(world.member, null)).items;

    expect(item).toMatchObject({ tripId: world.ours.id, tripName: "Ours", was: null });
    expect(await webPort.readPlanChangeNote(world.member, world.ours.id, item.id)).toMatchObject({ kind: "event_added", title: "Benagil caves", index: 0, total: 1 });
    expect(await webPort.readPlanChangeNote(world.admin, world.ours.id, item.id)).toBeNull();
  });

  it("counts the bell as unseen, and empties it on seeing without reading", async () => {
    await nudge();
    expect(await webPort.countUnreadNotifications(world.member)).toBe(1);

    await webPort.markNotificationsSeen(world.member);
    expect(await webPort.countUnreadNotifications(world.member)).toBe(0);
    expect((await webPort.listNotifications(world.member, null)).items[0].read).toBe(false);
  });

  it("marks them all read, for the viewer alone", async () => {
    await nudge();
    await webPort.markAllNotificationsRead(world.outsider);
    expect((await webPort.listNotifications(world.member, null)).items[0].read).toBe(false);

    await webPort.markAllNotificationsRead(world.member);
    expect((await webPort.listNotifications(world.member, null)).items[0].read).toBe(true);
  });

  it("opens one and says where it points, but never somebody else's", async () => {
    await nudge("money");
    const [item] = (await webPort.listNotifications(world.member, null)).items;

    expect(await webPort.openNotification(world.outsider, item.id)).toBeNull();
    expect(await webPort.openNotification(world.member, item.id)).toBe(
      `/trip/${world.ours.id}/money`,
    );
  });
});
