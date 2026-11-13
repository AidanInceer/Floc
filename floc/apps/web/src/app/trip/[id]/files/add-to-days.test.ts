/** "Add to Days" from the Files page (#559): the form's answers, checked at the door. */
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { dayEvent, document } from "@/db/schema";
import { expectNotFound, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { addFileToDays } from "./actions";

let world: Scenario;
let fileId: number;

beforeAll(migrateTestDb);
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
  const row = await db
    .insert(document)
    .values({ tripId: world.ours.id, uploadedBy: world.member, ownerId: world.member, name: "Flight.pdf", storageKey: "flight.pdf", mimeType: "application/pdf", sizeBytes: 8, category: "travel" })
    .returning({ id: document.id })
    .get();
  fileId = row.id;
});

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

describe("Add to Days", () => {
  it("makes the transport event from a Travel file's form", async () => {
    const answer = await addFileToDays(world.ours.id, fileId, form({ kind: "travel", dayId: String(world.ours.dayId), title: "FR 8347", transportType: "flight", time: "06:25", endTime: "08:55" }));
    expect(answer).toBeUndefined();
    const made = (await db.select().from(dayEvent).all()).find((event) => event.title === "FR 8347")!;
    expect(made).toMatchObject({ type: "transport", transportType: "flight", time: "06:25" });
    expect((await db.select().from(document).where(eq(document.id, fileId)).all())[0].dayEventId).toBe(made.id);
  });

  it("puts a Hotel file on its first night", async () => {
    await addFileToDays(world.ours.id, fileId, form({ kind: "hotel", dayId: String(world.ours.dayId) }));
    expect((await db.select().from(document).where(eq(document.id, fileId)).all())[0]).toMatchObject({ dayId: world.ours.dayId, dayEventId: null });
  });

  it("asks for a day and a name", async () => {
    expect(await addFileToDays(world.ours.id, fileId, form({ kind: "travel", title: "FR 8347" }))).toEqual({ error: "Choose a day." });
    expect(await addFileToDays(world.ours.id, fileId, form({ kind: "travel", dayId: String(world.ours.dayId), title: "" }))).toEqual({ error: "Give the event a name." });
  });

  it("refuses someone who is not on the trip (rule 5)", async () => {
    signIn(world.outsider);
    await expectNotFound(() => addFileToDays(world.ours.id, fileId, form({ kind: "hotel", dayId: String(world.ours.dayId) })));
  });
});
