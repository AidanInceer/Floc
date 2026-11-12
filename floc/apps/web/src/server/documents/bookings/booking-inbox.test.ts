/** A member's Bookings area (#559, ADR-049): files wait there for a trip, and only for their own member. */
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { bookingInbox, document } from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import {
  bookingInboxUsage, placeWaitingBooking, purgeWaitingBookings, removeWaitingBooking,
  saveWaitingBooking, tripsForPlacing, waitingBookings, waitingCount,
} from "./booking-inbox";
import { waitingKeysOwnedBy } from "./booking-inbox-rows";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date();
const daysOn = (days: number) => new Date(NOW.getTime() + days * DAY);

let world: Scenario;
let dir: string;
const saved = process.env.FLOC_FILES_DIR;

beforeAll(async () => {
  await migrateTestDb();
  dir = await mkdtemp(path.join(tmpdir(), "floc-bookings-"));
  process.env.FLOC_FILES_DIR = dir;
});
afterAll(async () => {
  if (saved === undefined) delete process.env.FLOC_FILES_DIR;
  else process.env.FLOC_FILES_DIR = saved;
  await rm(dir, { recursive: true, force: true });
});
beforeEach(async () => {
  for (const file of await readdir(dir)) await rm(path.join(dir, file), { force: true });
  await resetDb();
  world = await seedScenario();
});

const upload = (userId: string, name = "Hotel.pdf") => saveWaitingBooking(userId, { name, mimeType: "application/pdf", bytes: PDF });
const onlyId = async (userId: string) => (await waitingBookings(userId))[0].id;

describe("a file waiting for a trip", () => {
  it("lists a member's own files, newest first, with the days it has left", async () => {
    expect(await upload(world.member)).toBeNull();
    const [file] = await waitingBookings(world.member);
    expect(file).toMatchObject({ name: "Hotel.pdf", category: "other", details: null, daysLeft: 7 });
    expect(await waitingCount(world.member)).toBe(1);
  });

  it("never shows one member's file to another", async () => {
    await upload(world.member);
    expect(await waitingBookings(world.admin)).toEqual([]);
    expect(await waitingCount(world.admin)).toBe(0);
  });

  it("keeps what was read with the file", async () => {
    await saveWaitingBooking(world.member, {
      name: "Stay.pdf", mimeType: "application/pdf", bytes: PDF, category: "hotel",
      details: { kind: "hotel", name: "Casa do Sol", checkIn: "2027-03-04", checkOut: "2027-03-07", reference: null },
    });
    expect((await waitingBookings(world.member))[0]).toMatchObject({ category: "hotel", details: { name: "Casa do Sol" } });
  });

  it("refuses what is not a PDF or an image, by type and by content", async () => {
    expect(await saveWaitingBooking(world.member, { name: "a.docx", mimeType: "application/msword", bytes: PDF })).toBeTruthy();
    expect(await saveWaitingBooking(world.member, { name: "a.png", mimeType: "image/png", bytes: PDF })).toBe("Only PDFs and images can go here");
    expect(await waitingBookings(world.member)).toEqual([]);
  });

  it("refuses a file past the list's space, and one past its count", async () => {
    await db.insert(bookingInbox).values({ userId: world.member, name: "Big.pdf", storageKey: "big.pdf", mimeType: "application/pdf", sizeBytes: 200 * 1024 ** 2 });
    expect(await upload(world.member)).toBeTruthy();
    await db.delete(bookingInbox);
    await db.insert(bookingInbox).values(Array.from({ length: 50 }, (_, i) => ({ userId: world.member, name: `${i}.pdf`, storageKey: `${i}.pdf`, mimeType: "application/pdf", sizeBytes: 1 })));
    expect(await upload(world.member)).toBe("Your bookings list is full. Choose a trip for some of them first.");
  });

  it("says what the list holds against its 200 MB", async () => {
    await upload(world.member);
    expect(await bookingInboxUsage(world.member)).toEqual({ usedBytes: 8, quotaBytes: 200 * 1024 ** 2 });
  });

  it("says storage is off when there is no volume", async () => {
    delete process.env.FLOC_FILES_DIR;
    expect(await upload(world.member)).toBe("File storage is not set up");
    expect(await waitingBookings(world.member)).toEqual([]);
    expect(await waitingCount(world.member)).toBe(0);
    expect(await purgeWaitingBookings()).toBe(0);
    process.env.FLOC_FILES_DIR = dir;
  });
});

describe("choosing its trip", () => {
  it("moves it to the member's private files on that trip, with the same bytes", async () => {
    await upload(world.member);
    const [row] = await db.select().from(bookingInbox).all();
    expect(await placeWaitingBooking(world.member, row.id, world.ours.id)).toBeNull();

    const [file] = await db.select().from(document).all();
    expect(file).toMatchObject({ tripId: world.ours.id, ownerId: world.member, uploadedBy: world.member, name: "Hotel.pdf", storageKey: row.storageKey });
    expect(await waitingBookings(world.member)).toEqual([]);
    const [closed] = await db.select().from(bookingInbox).all();
    expect(closed.placedAt).not.toBeNull();
  });

  it("refuses a trip the member is not on, in the same words as one that does not exist (rule 5)", async () => {
    await upload(world.member);
    const id = await onlyId(world.member);
    expect(await placeWaitingBooking(world.member, id, world.theirs.id)).toBe("Choose one of your trips.");
    expect(await placeWaitingBooking(world.member, id, 99999)).toBe("Choose one of your trips.");
    expect(await db.select().from(document).all()).toEqual([]);
  });

  it("refuses to place somebody else's waiting file", async () => {
    await upload(world.member);
    const id = await onlyId(world.member);
    expect(await placeWaitingBooking(world.admin, id, world.ours.id)).toBe("That file is no longer waiting.");
    expect(await waitingBookings(world.member)).toHaveLength(1);
  });

  it("offers only the member's own live trips", async () => {
    expect((await tripsForPlacing(world.member)).map((t) => t.name)).toEqual(["Ours"]);
    expect((await tripsForPlacing(world.outsider)).map((t) => t.name)).toEqual(["Theirs"]);
  });
});

describe("leaving the list", () => {
  it("goes at once when its member removes it, and only for them", async () => {
    await upload(world.member);
    const id = await onlyId(world.member);
    await removeWaitingBooking(world.admin, id);
    expect(await waitingBookings(world.member)).toHaveLength(1);
    expect(await readdir(dir)).toHaveLength(1);
    await removeWaitingBooking(world.member, id);
    expect(await waitingBookings(world.member)).toEqual([]);
  });

  it("takes a removed file's bytes off the disk at once, so upload-then-remove cannot fill it", async () => {
    for (let round = 0; round < 3; round += 1) {
      await upload(world.member, `Loop ${round}.pdf`);
      await removeWaitingBooking(world.member, await onlyId(world.member));
    }
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("lets only one of two places at once take the file, so its bytes have one owner", async () => {
    await upload(world.member);
    const id = await onlyId(world.member);
    const answers = await Promise.all([placeWaitingBooking(world.member, id, world.ours.id), placeWaitingBooking(world.member, id, world.ours.id)]);
    expect(answers.filter((answer) => answer === null)).toHaveLength(1);
    expect(await db.select().from(document).all()).toHaveLength(1);
  });

  it("sweeps every file past its month, however many there are", async () => {
    const old = new Date(NOW.getTime() - 32 * DAY);
    await db.insert(bookingInbox).values(
      Array.from({ length: 620 }, (_, i) => ({ userId: world.member, name: `${i}.pdf`, storageKey: `old-${i}.pdf`, mimeType: "application/pdf", sizeBytes: 1, createdAt: old })),
    );
    expect(await purgeWaitingBookings(NOW)).toBe(620);
  });

  it("leaves after a week, and frees its space", async () => {
    await upload(world.member);
    expect(await waitingBookings(world.member, daysOn(6))).toHaveLength(1);
    expect(await waitingBookings(world.member, daysOn(8))).toEqual([]);
    expect(await bookingInboxUsage(world.member, daysOn(8))).toMatchObject({ usedBytes: 0 });
    const [row] = await db.select().from(bookingInbox).all();
    expect(await placeWaitingBooking(world.member, row.id, world.ours.id, daysOn(8))).toBe("That file is no longer waiting.");
  });

  it("keeps its bytes for a month, then deletes them for good", async () => {
    await upload(world.member);
    expect(await purgeWaitingBookings(daysOn(29))).toBe(0);
    expect(await readdir(dir)).toHaveLength(1);
    expect(await purgeWaitingBookings(daysOn(31))).toBe(1);
    expect(await readdir(dir)).toHaveLength(0);
    expect(await db.select().from(bookingInbox).all()).toHaveLength(1);
  });

  it("never deletes the bytes of a file that was placed on a trip", async () => {
    await upload(world.member);
    await placeWaitingBooking(world.member, await onlyId(world.member), world.ours.id);
    expect(await purgeWaitingBookings(daysOn(31))).toBe(0);
    expect(await readdir(dir)).toHaveLength(1);
  });

  it("names a member's unplaced files for erasing their account", async () => {
    await upload(world.member);
    await upload(world.member, "Second.pdf");
    const [first] = await db.select().from(bookingInbox).where(eq(bookingInbox.name, "Hotel.pdf")).all();
    await placeWaitingBooking(world.member, first.id, world.ours.id);
    expect(await waitingKeysOwnedBy(world.member, NOW)).toHaveLength(1);
    expect(await waitingKeysOwnedBy(world.member, daysOn(31))).toEqual([]);
  });
});
