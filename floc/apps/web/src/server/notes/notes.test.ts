import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import {
  findNote,
  insertNote,
  NOTE_BODY_MAX,
  resolveParent,
  softDeleteNoteAndReplies,
  toggleReaction,
  updateNoteBody,
} from "@/server/notes/notes";
import { loadThreads } from "@/server/notes/notes-read";

let world: Scenario;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

const notesOf = (tripId: number) =>
  db.select().from(schema.comment).where(eq(schema.comment.tripId, tripId)).all();

async function post(body: string, parentId: number | null = null) {
  await insertNote({
    tripId: world.ours.id,
    createdBy: world.admin,
    scope: "day_event",
    scopeId: world.ours.eventId,
    parentId,
    body,
  });
  const rows = await notesOf(world.ours.id);
  return rows[rows.length - 1];
}

async function pageOn(tripId: number): Promise<number> {
  const row = await db
    .insert(schema.tripPage)
    .values({ tripId, body: "{}", updatedBy: world.admin })
    .returning({ id: schema.tripPage.id })
    .get();
  return row.id;
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

  it("keeps a comment on an event apart from a comment on a page with the same number", async () => {
    const page = await pageOn(world.ours.id);
    await post("About the event");
    await insertNote({ tripId: world.ours.id, createdBy: world.member, scope: "page", scopeId: page, parentId: null, body: "About the page" });

    const read = (scope: "day_event" | "page") =>
      loadThreads({ tripId: world.ours.id, scope, viewerId: world.admin, toneOf: new Map() });

    expect((await read("day_event")).get(world.ours.eventId)?.map((n) => n.body)).toEqual(["About the event"]);
    expect((await read("page")).get(page)?.map((n) => n.body)).toEqual(["About the page"]);
    expect((await findNote(world.ours.id, (await notesOf(world.ours.id))[1].id))?.scope).toBe("page");
  });
});

describe("what the database holds a comment to", () => {
  const raw = (over: Partial<typeof schema.comment.$inferInsert>) =>
    db.insert(schema.comment).values({
      tripId: world.ours.id,
      createdBy: world.admin,
      body: "Worth a look",
      ...over,
    });

  it("takes a comment on one event, or on one page", async () => {
    await raw({ dayEventId: world.ours.eventId });
    await raw({ pageId: await pageOn(world.ours.id) });
    expect(await notesOf(world.ours.id)).toHaveLength(2);
  });

  it("refuses a comment with no subject", async () => {
    await expect(raw({})).rejects.toThrow();
  });

  it("refuses a comment with two subjects", async () => {
    await expect(raw({ dayEventId: world.ours.eventId, pageId: await pageOn(world.ours.id) })).rejects.toThrow();
  });

  it("refuses a comment moved off its subject", async () => {
    const row = await post("Worth a look");
    await expect(db.update(schema.comment).set({ dayEventId: null }).where(eq(schema.comment.id, row.id))).rejects.toThrow();
  });

  it("refuses a reply to a comment that does not exist", async () => {
    await expect(raw({ dayEventId: world.ours.eventId, parentId: 999_999 })).rejects.toThrow();
  });

  it("refuses a comment on another trip's event or page (rule 5)", async () => {
    await expect(raw({ dayEventId: world.theirs.eventId })).rejects.toThrow();
    await expect(raw({ pageId: await pageOn(world.theirs.id) })).rejects.toThrow();
  });
});

describe("replying", () => {
  it("attaches a reply to the comment it answers", async () => {
    const parent = await post("Worth a look");
    const resolved = await resolveParent({
      tripId: world.ours.id,
      scope: "day_event",
      scopeId: world.ours.eventId,
      replyTo: parent.id,
    });
    expect(resolved).toBe(parent.id);
  });

  it("flattens a reply-to-a-reply onto the original parent (one level deep)", async () => {
    const parent = await post("Worth a look");
    const reply = await post("Agreed", parent.id);

    const resolved = await resolveParent({
      tripId: world.ours.id,
      scope: "day_event",
      scopeId: world.ours.eventId,
      replyTo: reply.id,
    });
    expect(resolved).toBe(parent.id);
  });

  it("refuses a target in another trip, or on another subject", async () => {
    const parent = await post("Worth a look");

    expect(
      await resolveParent({
        tripId: world.theirs.id,
        scope: "day_event",
        scopeId: world.ours.eventId,
        replyTo: parent.id,
      }),
    ).toBeUndefined();

    expect(
      await resolveParent({
        tripId: world.ours.id,
        scope: "page",
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
    expect(await findNote(world.ours.id, other.id)).toBeDefined();
  });
});

describe("reacting", () => {
  it("revives the same row instead of inserting a second one", async () => {
    const row = await post("Worth a look");

    const reactions = () =>
      db
        .select()
        .from(schema.commentReaction)
        .where(eq(schema.commentReaction.commentId, row.id))
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

  it("cannot duplicate a row when two taps land together", async () => {
    const row = await post("Worth a look");

    await Promise.all([
      toggleReaction(row.id, world.member, "heart"),
      toggleReaction(row.id, world.member, "heart"),
      toggleReaction(row.id, world.member, "heart"),
    ]);

    const rows = await db
      .select()
      .from(schema.commentReaction)
      .where(eq(schema.commentReaction.commentId, row.id))
      .all();
    expect(rows).toHaveLength(1);
  });

  it("keeps the three kinds independent of each other", async () => {
    const row = await post("Worth a look");
    await toggleReaction(row.id, world.member, "heart");
    await toggleReaction(row.id, world.member, "up");

    const live = (
      await db
        .select()
        .from(schema.commentReaction)
        .where(eq(schema.commentReaction.commentId, row.id))
        .all()
    ).filter((r) => r.deletedAt === null);
    expect(live.map((r) => r.kind).sort()).toEqual(["heart", "up"]);
  });
});
