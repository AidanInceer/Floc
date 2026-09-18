/**
 * The ideas half of the port: the rules a phone gets are the web's own —
 * one vote per person, any member may remove, and another trip is not
 * addressable.
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

const put = (who: string, title: string) => webPort.addIdea(who, world.ours.id, title);
const ideas = (who: string) => webPort.listIdeas(who, world.ours.id);

describe("reading", () => {
  it("carries the author, the tally and whose vote it is", async () => {
    await put(world.admin, "Lisbon");
    const [idea] = await ideas(world.admin);

    expect(idea.title).toBe("Lisbon");
    expect(idea.authorName).toBe("Ada");
    // A time crosses as a string, because a Date does not survive JSON.
    expect(typeof idea.createdAt).toBe("string");
    expect(idea).toMatchObject({ votes: 0, mine: false });
  });

  it("refuses a trip the viewer is not in", async () => {
    await expect(webPort.listIdeas(world.outsider, world.ours.id)).rejects.toThrow();
  });
});

describe("voting", () => {
  it("counts one vote per person and takes it back on a second tap", async () => {
    await put(world.admin, "Campervan");
    const [idea] = await ideas(world.admin);

    await webPort.voteIdea(world.admin, world.ours.id, idea.id);
    await webPort.voteIdea(world.member, world.ours.id, idea.id);
    expect((await ideas(world.admin))[0]).toMatchObject({ votes: 2, mine: true });

    await webPort.voteIdea(world.admin, world.ours.id, idea.id);
    expect((await ideas(world.admin))[0]).toMatchObject({ votes: 1, mine: false });
  });
});

describe("removing", () => {
  it("lets a member remove somebody else's idea", async () => {
    await put(world.admin, "Ski week");
    const [idea] = await ideas(world.admin);

    await webPort.removeIdea(world.member, world.ours.id, idea.id);
    expect(await ideas(world.admin)).toEqual([]);
  });

  it("ignores an id belonging to another trip", async () => {
    await put(world.admin, "Peaks");
    const [idea] = await ideas(world.admin);

    await webPort.removeIdea(world.outsider, world.theirs.id, idea.id);
    expect((await ideas(world.admin)).map((row) => row.id)).toEqual([idea.id]);
  });
});
