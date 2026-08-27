/**
 * The Notes doc write (ticket 238) — one row per trip, whole blob, and no way
 * in from a trip you are not in (rule 5).
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  expectNotFound,
  migrateTestDb,
  resetDb,
  seedScenario,
  signIn,
  type Scenario,
} from "@/test/db";
import { loadNoteDoc } from "@/server/note-doc";
import { saveNotes } from "./actions";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

const doc = (text: string) =>
  JSON.stringify([{ type: "paragraph", content: [{ type: "text", text }] }]);

describe("saveNotes", () => {
  it("stores the document and hands the same string back", async () => {
    await saveNotes(world.ours.id, doc("Kyoto in April"));

    expect(await loadNoteDoc(world.ours.id)).toBe(doc("Kyoto in April"));
  });

  it("replaces rather than appends — one doc per trip", async () => {
    await saveNotes(world.ours.id, doc("first"));
    await saveNotes(world.ours.id, doc("second"));

    expect(await loadNoteDoc(world.ours.id)).toBe(doc("second"));
  });

  it("reads as empty until somebody writes", async () => {
    expect(await loadNoteDoc(world.ours.id)).toBeNull();
  });

  it("refuses a trip the viewer is not in", async () => {
    signIn(world.outsider);

    await expectNotFound(() => saveNotes(world.ours.id, doc("sneaked in")));
    expect(await loadNoteDoc(world.ours.id)).toBeNull();
  });

  it("rejects a document past the cap rather than truncating it", async () => {
    await expect(
      saveNotes(world.ours.id, "x".repeat(400_001)),
    ).rejects.toThrow(/too long/);
  });
});
