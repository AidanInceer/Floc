/**
 * #403: the two marks the inbox writes. Seeing is landing on the page and
 * answers the bell; reading is opening a row, or the control that clears the
 * lot. Neither may touch anybody else's rows.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { REDIRECT } from "@/test/setup";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { countUnread, listInbox } from "@/server/notifications/inbox";
import { insertNudge } from "@/server/trips/roster";

import { openNotification, readEverything, seeInbox } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

const nudge = (tab: "dates" | "money" = "dates") =>
  insertNudge({
    tripId: world.ours.id,
    fromUserId: world.admin,
    toUserId: world.member,
    tab,
    message: null,
  });

const form = (id: string | number): FormData => {
  const fd = new FormData();
  fd.append("id", String(id));
  return fd;
};

describe("opening one notification", () => {
  it("marks it read and sends you to the thing it names", async () => {
    await nudge("money");
    const [item] = (await listInbox(world.member, null)).items;

    await expect(openNotification(form(item.id))).rejects.toThrow(
      `${REDIRECT}:/trip/${world.ours.id}/money`,
    );
    expect((await listInbox(world.member, null)).items[0].read).toBe(true);
  });

  it("falls back to the inbox when the id is not yours", async () => {
    await nudge();
    const [item] = (await listInbox(world.member, null)).items;
    signIn(world.outsider);

    await expect(openNotification(form(item.id))).rejects.toThrow(`${REDIRECT}:/inbox`);
    expect((await listInbox(world.member, null)).items[0].read).toBe(false);
  });

  it("does nothing at all for an id that is not a positive integer", async () => {
    await nudge();
    await expect(openNotification(form("nope"))).resolves.toBeUndefined();
    await expect(openNotification(form(0))).resolves.toBeUndefined();
    expect(await countUnread(world.member)).toBe(1);
  });
});

describe("landing on the inbox", () => {
  it("answers the bell without reading anything", async () => {
    await nudge();
    await seeInbox();

    expect(await countUnread(world.member)).toBe(0);
    expect((await listInbox(world.member, null)).items[0].read).toBe(false);
  });
});

describe("mark all as read", () => {
  it("clears every row of yours, and nobody else's", async () => {
    await nudge();
    signIn(world.outsider);
    await readEverything();
    expect((await listInbox(world.member, null)).items[0].read).toBe(false);

    signIn(world.member);
    await readEverything();
    expect((await listInbox(world.member, null)).items[0].read).toBe(true);
    expect(await countUnread(world.member)).toBe(0);
  });
});
