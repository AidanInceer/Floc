/** Comments on a notes page (#408). */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { addPageComment, loadPageComments, resolvePageComment } from "./page-comments";
import { archivePage, createPage } from "./pages";
import { loadPages } from "./pages-read";

let world: Scenario;
let pageId: number;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  pageId = (await loadPages(world.ours.id, world.admin)).pages[0].id;
});

const load = (id = pageId) => loadPageComments({ tripId: world.ours.id, pageId: id, viewerId: world.admin, toneOf: new Map() });
const post = async (replyTo: number | null, body: string, userId = world.member) => {
  const made = await addPageComment({ tripId: world.ours.id, pageId, userId, replyTo, body });
  if ("error" in made) throw new Error(made.error);
  return made.id;
};

describe("page comments", () => {
  it("starts a thread and takes replies, one level deep", async () => {
    const first = await post(null, "Only if two of us can drive.");
    const reply = await post(first, "I can drive. Who else?", world.admin);
    await post(reply, "Me");
    const [thread] = await load();
    expect(thread.id).toBe(first);
    expect(thread.replies.map((row) => row.body)).toEqual(["I can drive. Who else?", "Me"]);
  });

  it("lets any member resolve a thread, which leaves the page", async () => {
    const first = await post(null, "Hire a car?");
    await resolvePageComment(world.ours.id, first);
    expect(await load()).toEqual([]);
  });

  it("will not resolve another trip's comment", async () => {
    const first = await post(null, "Hire a car?");
    await resolvePageComment(world.theirs.id, first);
    expect(await load()).toHaveLength(1);
  });

  it("refuses an empty comment, a gone reply target and an archived page", async () => {
    expect(await addPageComment({ tripId: world.ours.id, pageId, userId: world.member, replyTo: null, body: "  " })).toEqual({ error: "Write something first." });
    expect(await addPageComment({ tripId: world.ours.id, pageId, userId: world.member, replyTo: 999, body: "x" })).toEqual({ error: "That comment has gone." });
    const spare = await createPage(world.ours.id, world.member, null);
    if ("error" in spare) throw new Error(spare.error);
    await archivePage(world.ours.id, spare.id, world.member);
    expect(await addPageComment({ tripId: world.ours.id, pageId: spare.id, userId: world.member, replyTo: null, body: "x" })).toEqual({ error: "That page has gone." });
  });

  it("keeps each page's threads to that page", async () => {
    await post(null, "On the first page");
    const other = await createPage(world.ours.id, world.member, null);
    if ("error" in other) throw new Error(other.error);
    expect(await load(other.id)).toEqual([]);
  });
});
