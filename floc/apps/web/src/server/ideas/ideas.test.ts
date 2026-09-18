/**
 * The ideas aggregate's rules: an idea is scoped to its trip, a vote is one per
 * person and toggles on the same row, and a removed idea leaves every read.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  findIdea,
  IDEA_TITLE_MAX,
  insertIdea,
  softDeleteIdea,
  toggleIdeaVote,
} from "@/server/ideas/ideas";
import { listIdeas } from "@/server/ideas/ideas-read";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const put = (title: string) =>
  insertIdea({ tripId: world.ours.id, createdBy: world.admin, title });

describe("adding", () => {
  it("scopes an idea to its trip, and a foreign trip cannot read it back", async () => {
    const id = await put("Lisbon");
    expect((await findIdea(world.ours.id, id))?.title).toBe("Lisbon");
    expect(await findIdea(world.theirs.id, id)).toBeUndefined();
  });

  it("caps the title rather than storing an unbounded string", async () => {
    const id = await put("x".repeat(IDEA_TITLE_MAX + 50));
    expect((await findIdea(world.ours.id, id))?.title).toHaveLength(IDEA_TITLE_MAX);
  });
});

describe("voting", () => {
  it("counts one vote per person and says whose it is", async () => {
    const id = await put("Campervan");
    await toggleIdeaVote(id, world.admin);
    await toggleIdeaVote(id, world.member);

    const [row] = await listIdeas(world.ours.id, world.admin);
    expect(row.votes).toBe(2);
    expect(row.mine).toBe(true);

    const [asOutsider] = await listIdeas(world.ours.id, world.outsider);
    expect(asOutsider.mine).toBe(false);
  });

  it("takes the vote back on a second tap, and gives it again on a third", async () => {
    const id = await put("Ski week");
    await toggleIdeaVote(id, world.admin);
    await toggleIdeaVote(id, world.admin);
    expect((await listIdeas(world.ours.id, world.admin))[0].votes).toBe(0);

    await toggleIdeaVote(id, world.admin);
    expect((await listIdeas(world.ours.id, world.admin))[0].votes).toBe(1);
  });
});

describe("removing", () => {
  it("takes the idea and its votes out of the list", async () => {
    const kept = await put("Peaks");
    const gone = await put("Hut to hut");
    await toggleIdeaVote(gone, world.member);

    await softDeleteIdea(world.ours.id, gone);

    const rows = await listIdeas(world.ours.id, world.admin);
    expect(rows.map((r) => r.id)).toEqual([kept]);
  });

  it("ignores a removal aimed at another trip's idea", async () => {
    const id = await put("Lisbon");
    await softDeleteIdea(world.theirs.id, id);
    expect(await findIdea(world.ours.id, id)).toBeDefined();
  });
});
