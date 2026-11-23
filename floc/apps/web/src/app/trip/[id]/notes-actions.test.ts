import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { addNote, react } from "./notes-actions";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.admin);
});

const body = (text: string) => {
  const fd = new FormData();
  fd.set("body", text);
  return fd;
};

describe("posting a comment", () => {
  it("lands on an event of this trip", async () => {
    await addNote(world.ours.id, "day_event", world.ours.eventId, null, body("Book ahead"));
    expect(await db.select().from(schema.comment).all()).toHaveLength(1);
  });

  it("will not land on another trip's event", async () => {
    await expectNotFound(() => addNote(world.ours.id, "day_event", world.theirs.eventId, null, body("Hi")));
    expect(await db.select().from(schema.comment).all()).toEqual([]);
  });

  it("refuses a comment on the trip, a day or an expense, which no screen makes", async () => {
    for (const [scope, id] of [["trip", world.ours.id], ["day", world.ours.dayId], ["expense", 1]] as const) {
      const result = await addNote(world.ours.id, scope as never, id, null, body("Hi"));
      expect(result?.error, scope).toBeTruthy();
    }
    expect(await db.select().from(schema.comment).all()).toEqual([]);
  });

  it("refuses a scope it does not know", async () => {
    const result = await addNote(world.ours.id, "planet" as never, 1, null, body("Hi"));
    expect(result?.error).toBeTruthy();
  });
});

describe("reacting", () => {
  it("ignores a kind that is not one of the three", async () => {
    await addNote(world.ours.id, "day_event", world.ours.eventId, null, body("Book ahead"));
    const [note] = await db.select().from(schema.comment).all();

    await react(world.ours.id, note.id, "lol" as never);

    expect(await db.select().from(schema.commentReaction).all()).toEqual([]);
  });
});
