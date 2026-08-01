/**
 * Cross-trip vote writes (tickets 104, 105).
 *
 * `deleteIdea` and `setIdeaPinned` always bound the idea to the trip; the two
 * vote actions two functions below did not, so any member of any trip could
 * vote on any idea by posting its id.
 */
import { and, eq, isNull } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import {
  expectNotFound,
  migrateTestDb,
  resetDb,
  seedScenario,
  signIn,
  type Scenario,
} from "@/test/db";
import { castVote, clearVote } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.outsider);
});

const liveVotes = async (ideaId: number) =>
  db
    .select({ id: schema.ideaVote.id })
    .from(schema.ideaVote)
    .where(
      and(
        eq(schema.ideaVote.ideaId, ideaId),
        isNull(schema.ideaVote.deletedAt),
      ),
    )
    .all();

describe("cross-trip votes", () => {
  it("castVote refuses an idea belonging to another trip", async () => {
    await expectNotFound(() =>
      castVote(world.theirs.id, world.ours.ideaId, "up"),
    );

    expect(await liveVotes(world.ours.ideaId)).toHaveLength(0);
  });

  it("clearVote refuses an idea belonging to another trip", async () => {
    signIn(world.member);
    await castVote(world.ours.id, world.ours.ideaId, "up");

    signIn(world.outsider);
    await expectNotFound(() =>
      clearVote(world.theirs.id, world.ours.ideaId),
    );

    // The member's vote is still standing — an outsider cannot clear a vote
    // they never cast, on a board they cannot see.
    expect(await liveVotes(world.ours.ideaId)).toHaveLength(1);
  });

  it("a member can still vote and un-vote on its own board", async () => {
    signIn(world.member);
    await castVote(world.ours.id, world.ours.ideaId, "up");
    expect(await liveVotes(world.ours.ideaId)).toHaveLength(1);

    await clearVote(world.ours.id, world.ours.ideaId);
    expect(await liveVotes(world.ours.ideaId)).toHaveLength(0);
  });
});
