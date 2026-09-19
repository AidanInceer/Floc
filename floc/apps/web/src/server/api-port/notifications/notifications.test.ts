/**
 * The notifications half of the port (#344, #403). The queries are proved in
 * `inbox.test.ts`; what matters here is that the phone's door carries the same
 * rules — seeing and reading are separate, and neither reaches past the viewer.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";
import { insertNudge } from "@/server/trips/roster";

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
    message: null,
  });

describe("the notifications port", () => {
  it("lists a page, naming the person and the trip, with the time as a string", async () => {
    await nudge();
    const page = await webPort.listNotifications(world.member, null);

    expect(page.next).toBeNull();
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ text: "Ada nudged you about Ours", read: false, loud: true });
    expect(typeof page.items[0].at).toBe("string");
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
