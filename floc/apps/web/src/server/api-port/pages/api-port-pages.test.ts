/**
 * Notes pages through the port (#408), against a real database: the phone's
 * road to the same list, with the same trip boundary (rule 5).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { webPort } from "@/server/api-port/api-port";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("pages through the port", () => {
  it("makes, names, moves, archives and restores a page", async () => {
    const { pages } = await webPort.listPages(world.member, world.ours.id);
    const made = await webPort.createPage(world.member, world.ours.id, null);
    if ("error" in made) throw new Error(made.error);
    expect(await webPort.renamePage(world.member, world.ours.id, made.id, "Where to eat")).toBeNull();
    await webPort.setPageIcon(world.member, world.ours.id, made.id, "food");
    expect(await webPort.movePage(world.member, world.ours.id, made.id, pages[0].id)).toBeNull();
    expect((await webPort.listPages(world.member, world.ours.id)).pages.map((page) => [page.title, page.icon])).toEqual([["Where to eat", "food"], ["Notes", null]]);

    expect(await webPort.archivePage(world.member, world.ours.id, made.id)).toBeNull();
    const after = await webPort.listPages(world.member, world.ours.id);
    expect(after.archived.map((page) => page.id)).toEqual([made.id]);
    expect(typeof after.archived[0].archivedAt).toBe("string");
    expect(await webPort.restorePage(world.member, world.ours.id, made.id)).toBeNull();
    expect(await webPort.archivePage(world.member, world.ours.id, pages[0].id)).toBeNull();
    expect(await webPort.archivePage(world.member, world.ours.id, made.id)).toBe("The last page stays.");
  });

  it("comments on a page, and any member resolves", async () => {
    const [page] = (await webPort.listPages(world.member, world.ours.id)).pages;
    const made = await webPort.addPageComment(world.member, world.ours.id, page.id, null, "Hire a car?");
    if ("error" in made) throw new Error(made.error);
    expect((await webPort.listPageComments(world.admin, world.ours.id, page.id)).map((row) => row.body)).toEqual(["Hire a car?"]);
    await webPort.resolvePageComment(world.admin, world.ours.id, made.id);
    expect(await webPort.listPageComments(world.admin, world.ours.id, page.id)).toEqual([]);
  });

  it("lists the trip's links", async () => {
    expect((await webPort.listTripLinks(world.member, world.ours.id)).map((item) => item.kind)).toContain("event");
  });

  it("refuses another trip the same as one that does not exist", async () => {
    await expect(webPort.listPages(world.outsider, world.ours.id)).rejects.toThrow("No such trip.");
    await expect(webPort.listPages(world.outsider, 999_999)).rejects.toThrow("No such trip.");
  });
});
