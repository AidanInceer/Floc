/** The Bookings page's actions (#559): the signed-in member's own files, never one named by the form. */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { document } from "@/db/schema";
import { waitingBookings } from "@/server/documents/bookings/booking-inbox";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { placeBooking, removeBooking, uploadBooking } from "./actions";

let world: Scenario;
let dir: string;
const saved = process.env.FLOC_FILES_DIR;

beforeAll(async () => {
  await migrateTestDb();
  dir = await mkdtemp(path.join(tmpdir(), "floc-bookings-actions-"));
  process.env.FLOC_FILES_DIR = dir;
});
afterAll(async () => {
  if (saved === undefined) delete process.env.FLOC_FILES_DIR;
  else process.env.FLOC_FILES_DIR = saved;
  await rm(dir, { recursive: true, force: true });
});
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

const pdf = (name = "Hotel.pdf") => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])], name, { type: "application/pdf" });
const form = (entries: Record<string, string | File>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

describe("the Bookings page", () => {
  it("uploads a file to the signed-in member's list", async () => {
    expect(await uploadBooking(form({ file: pdf() }))).toBeUndefined();
    expect((await waitingBookings(world.member)).map((file) => file.name)).toEqual(["Hotel.pdf"]);
  });

  it("says what is wrong with an upload", async () => {
    expect(await uploadBooking(form({}))).toEqual({ error: "Pick a file first" });
    expect(await uploadBooking(form({ file: new File(["x"], "notes.txt", { type: "text/plain" }) }))).toHaveProperty("error");
    expect(await uploadBooking(form({ file: new File(["not a pdf"], "fake.pdf", { type: "application/pdf" }) }))).toEqual({ error: "Only PDFs and images can go here" });
  });

  it("moves a file to the chosen trip, as the member's private file", async () => {
    await uploadBooking(form({ file: pdf() }));
    const [file] = await waitingBookings(world.member);
    expect(await placeBooking(file.id, form({ tripId: String(world.ours.id) }))).toBeUndefined();
    expect((await db.select().from(document).all())[0]).toMatchObject({ tripId: world.ours.id, ownerId: world.member });
  });

  it("asks for a trip, and refuses one the member is not on", async () => {
    await uploadBooking(form({ file: pdf() }));
    const [file] = await waitingBookings(world.member);
    expect(await placeBooking(file.id, form({}))).toEqual({ error: "Choose a trip." });
    expect(await placeBooking(file.id, form({ tripId: String(world.theirs.id) }))).toEqual({ error: "Choose one of your trips." });
  });

  it("never acts on another member's file", async () => {
    await uploadBooking(form({ file: pdf() }));
    const [file] = await waitingBookings(world.member);
    signIn(world.admin);
    await removeBooking(file.id);
    expect(await placeBooking(file.id, form({ tripId: String(world.ours.id) }))).toEqual({ error: "That file is no longer waiting." });
    expect(await waitingBookings(world.member)).toHaveLength(1);
    signIn(world.member);
    await removeBooking(file.id);
    expect(await waitingBookings(world.member)).toEqual([]);
  });
});
