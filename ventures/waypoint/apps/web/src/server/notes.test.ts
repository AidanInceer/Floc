/**
 * The notes aggregate's two structural rules (ticket 108): threads are exactly
 * one level deep, and a parent takes its replies with it when it goes.
 *
 * Both are properties of the table's shape rather than of any one tab, which is
 * why they are tested against the module rather than through `notes-actions.ts`.
 */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  findNote,
  insertNote,
  NOTE_BODY_MAX,
  resolveParent,
  revalidateThread,
  softDeleteNoteAndReplies,
  toggleReaction,
  updateNoteBody,
} from "@/server/notes";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const notesOf = (tripId: number) =>
  db.select().from(schema.note).where(eq(schema.note.tripId, tripId)).all();

async function post(body: string, parentId: number | null = null) {
  await insertNote({
    tripId: world.ours.id,
    createdBy: world.admin,
    scope: "idea",
    scopeId: world.ours.ideaId,
    parentId,
    body,
  });
  const rows = await notesOf(world.ours.id);
  return rows[rows.length - 1];
}

describe("posting", () => {
  it("scopes a note to its trip, and a foreign trip cannot read it back", async () => {
    const row = await post("Worth a look");
    expect((await findNote(world.ours.id, row.id))?.body).toBe("Worth a look");
    expect(await findNote(world.theirs.id, row.id)).toBeUndefined();
  });

  it("caps the body rather than storing an unbounded string", async () => {
    const row = await post("x".repeat(NOTE_BODY_MAX + 500));
    expect(row.body).toHaveLength(NOTE_BODY_MAX);
  });
});

describe("replying", () => {
  it("attaches a reply to the comment it answers", async () => {
    const parent = await post("Worth a look");
    const resolved = await resolveParent({
      tripId: world.ours.id,
      scope: "idea",
      scopeId: world.ours.ideaId,
      replyTo: parent.id,
    });
    expect(resolved).toBe(parent.id);
  });

  it("flattens a reply-to-a-reply onto the original parent (one level deep)", async () => {
    const parent = await post("Worth a look");
    const reply = await post("Agreed", parent.id);

    const resolved = await resolveParent({
      tripId: world.ours.id,
      scope: "idea",
      scopeId: world.ours.ideaId,
      replyTo: reply.id,
    });
    expect(resolved).toBe(parent.id);
  });

  it("refuses a target in another trip, or on another scope", async () => {
    const parent = await post("Worth a look");

    expect(
      await resolveParent({
        tripId: world.theirs.id,
        scope: "idea",
        scopeId: world.ours.ideaId,
        replyTo: parent.id,
      }),
    ).toBeUndefined();

    expect(
      await resolveParent({
        tripId: world.ours.id,
        scope: "day_event",
        scopeId: world.ours.eventId,
        replyTo: parent.id,
      }),
    ).toBeUndefined();
  });
});

describe("editing", () => {
  it("stamps edited and caps the new body too", async () => {
    const row = await post("Worth a look");
    await updateNoteBody(row.id, "y".repeat(NOTE_BODY_MAX + 10));

    const after = await findNote(world.ours.id, row.id);
    expect(after?.body).toHaveLength(NOTE_BODY_MAX);
    const stored = (await notesOf(world.ours.id)).find((n) => n.id === row.id);
    expect(stored?.editedAt).not.toBeNull();
  });
});

describe("deleting", () => {
  it("takes the replies with the parent", async () => {
    const parent = await post("Worth a look");
    const reply = await post("Agreed", parent.id);
    const other = await post("Separate thought");

    await softDeleteNoteAndReplies(parent.id);

    expect(await findNote(world.ours.id, parent.id)).toBeUndefined();
    expect(await findNote(world.ours.id, reply.id)).toBeUndefined();
    // An unrelated top-level comment is untouched.
    expect(await findNote(world.ours.id, other.id)).toBeDefined();
  });
});

describe("reacting", () => {
  it("revives the same row instead of inserting a second one", async () => {
    const row = await post("Worth a look");

    const reactions = () =>
      db
        .select()
        .from(schema.noteReaction)
        .where(eq(schema.noteReaction.noteId, row.id))
        .all();

    await toggleReaction(row.id, world.member, "heart");
    expect(await reactions()).toHaveLength(1);
    expect((await reactions())[0].deletedAt).toBeNull();

    await toggleReaction(row.id, world.member, "heart");
    expect(await reactions()).toHaveLength(1);
    expect((await reactions())[0].deletedAt).not.toBeNull();

    await toggleReaction(row.id, world.member, "heart");
    expect(await reactions()).toHaveLength(1);
    expect((await reactions())[0].deletedAt).toBeNull();
  });

  it("keeps the three kinds independent of each other", async () => {
    const row = await post("Worth a look");
    await toggleReaction(row.id, world.member, "heart");
    await toggleReaction(row.id, world.member, "up");

    const live = (
      await db
        .select()
        .from(schema.noteReaction)
        .where(eq(schema.noteReaction.noteId, row.id))
        .all()
    ).filter((r) => r.deletedAt === null);
    expect(live.map((r) => r.kind).sort()).toEqual(["heart", "up"]);
  });
});

describe("revalidation", () => {
  it("names a path for every scope", () => {
    for (const scope of ["idea", "day", "day_event", "expense", "trip"] as const) {
      expect(() => revalidateThread(world.ours.id, scope)).not.toThrow();
    }
  });
});
