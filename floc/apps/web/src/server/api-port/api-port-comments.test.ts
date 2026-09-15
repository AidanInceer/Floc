/**
 * Event comments through the port, against a real database (ticket 325).
 *
 * WHAT THESE ARE FOR. The phone is the second road to a table the website
 * already writes, and the rules that matter are the ones a second road drops:
 * a thread stays one level deep, an event from another trip is not readable,
 * and "may I delete this" answers the same on both.
 *
 * THE TRIP BOUNDARY IS THE ONE WORTH PROVING. A `dayEventId` is a number a
 * client picks; the resolver has to refuse another trip's rather than hand
 * back its thread.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

/** The one event both the admin and the member can see. */
const ours = () => ({ trip: world.ours.id, event: world.ours.eventId });

describe("talking about an event", () => {
  it("posts a comment and reads it back", async () => {
    const refusal = await webPort.addEventComment(
      world.admin,
      ours().trip,
      ours().event,
      null,
      "Booked the 09:40.",
    );
    expect(refusal).toBeNull();

    const thread = await webPort.listEventComments(world.member, ours().trip, ours().event);
    expect(thread.map((c) => c.body)).toEqual(["Booked the 09:40."]);
    expect(thread[0].authorName).toBe("Ada");
    // A time crosses as a string, because a Date does not survive JSON.
    expect(typeof thread[0].createdAt).toBe("string");
  });

  it("keeps a reply under its parent, one level deep", async () => {
    await webPort.addEventComment(world.admin, ours().trip, ours().event, null, "Ferry or bus?");
    const [run] = await webPort.listEventComments(world.admin, ours().trip, ours().event);

    await webPort.addEventComment(world.member, ours().trip, ours().event, run.id, "Ferry.");
    const [withReply] = await webPort.listEventComments(world.admin, ours().trip, ours().event);
    const [reply] = withReply.replies;
    expect(reply.body).toBe("Ferry.");

    // Answering the reply attaches to the same parent, not under the reply.
    await webPort.addEventComment(world.admin, ours().trip, ours().event, reply.id, "Agreed.");
    const [again] = await webPort.listEventComments(world.admin, ours().trip, ours().event);
    expect(again.replies.map((r) => r.body)).toEqual(["Ferry.", "Agreed."]);
    expect(again.replies.every((r) => r.replies.length === 0)).toBe(true);
  });

  it("refuses a reply to a comment that has gone, in words", async () => {
    const refusal = await webPort.addEventComment(
      world.admin,
      ours().trip,
      ours().event,
      999_999,
      "Answering nothing.",
    );
    expect(refusal).toBe("That comment has gone.");
  });

  it("cannot read another trip's event", async () => {
    await expect(
      webPort.listEventComments(world.admin, ours().trip, world.theirs.eventId),
    ).rejects.toThrow();
  });
});

describe("changing what was said", () => {
  it("lets the author rewrite their own and marks it edited", async () => {
    await webPort.addEventComment(world.member, ours().trip, ours().event, null, "10:40.");
    const [comment] = await webPort.listEventComments(world.member, ours().trip, ours().event);

    expect(
      await webPort.editComment(world.member, ours().trip, comment.id, "09:40, sorry."),
    ).toBeNull();

    const [edited] = await webPort.listEventComments(world.member, ours().trip, ours().event);
    expect(edited.body).toBe("09:40, sorry.");
    expect(edited.editedAt).not.toBeNull();
  });

  it("refuses to put words in somebody else's mouth, admin or not", async () => {
    await webPort.addEventComment(world.member, ours().trip, ours().event, null, "Mine.");
    const [comment] = await webPort.listEventComments(world.member, ours().trip, ours().event);

    // The admin holds exactly three powers and this is not one of them (rule 6).
    expect(await webPort.editComment(world.admin, ours().trip, comment.id, "Not mine.")).toBe(
      "You can only edit your own comments.",
    );
  });

  it("takes a comment and its replies away together", async () => {
    await webPort.addEventComment(world.member, ours().trip, ours().event, null, "Ferry or bus?");
    const [run] = await webPort.listEventComments(world.member, ours().trip, ours().event);
    await webPort.addEventComment(world.admin, ours().trip, ours().event, run.id, "Ferry.");

    await webPort.deleteComment(world.member, ours().trip, run.id);

    expect(await webPort.listEventComments(world.member, ours().trip, ours().event)).toEqual([]);
  });

  it("refuses to remove somebody else's comment, admin or not", async () => {
    await webPort.addEventComment(world.member, ours().trip, ours().event, null, "Theirs.");
    const [comment] = await webPort.listEventComments(world.member, ours().trip, ours().event);

    await webPort.addEventComment(world.admin, ours().trip, ours().event, null, "Ours.");
    const admins = await webPort.listEventComments(world.admin, ours().trip, ours().event);
    const byAdmin = admins.find((c) => c.body === "Ours.")!;

    await expect(webPort.deleteComment(world.member, ours().trip, byAdmin.id)).rejects.toThrow();
    await expect(webPort.deleteComment(world.admin, ours().trip, comment.id)).rejects.toThrow();

    const left = await webPort.listEventComments(world.admin, ours().trip, ours().event);
    expect(left.map((c) => c.body).sort()).toEqual(["Ours.", "Theirs."]);
  });
});

describe("reacting", () => {
  it("counts a reaction and takes it back on a second press", async () => {
    await webPort.addEventComment(world.admin, ours().trip, ours().event, null, "The 09:40.");
    const [comment] = await webPort.listEventComments(world.admin, ours().trip, ours().event);

    await webPort.reactToComment(world.member, ours().trip, comment.id, "up");
    const [agreed] = await webPort.listEventComments(world.member, ours().trip, ours().event);
    expect(agreed.reactions.up).toEqual({ count: 1, mine: true });
    // Somebody else's reaction counts but is not theirs.
    const [seen] = await webPort.listEventComments(world.admin, ours().trip, ours().event);
    expect(seen.reactions.up).toEqual({ count: 1, mine: false });

    await webPort.reactToComment(world.member, ours().trip, comment.id, "up");
    const [undone] = await webPort.listEventComments(world.member, ours().trip, ours().event);
    expect(undone.reactions.up).toEqual({ count: 0, mine: false });
  });
});
