/** The Bookings port (#559): a viewer's own waiting files, and what Floc read only for Pro. */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import { document } from "@/db/schema";
import { saveWaitingBooking } from "@/server/documents/bookings/booking-inbox";
import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { bookingsPort } from "./bookings";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const BASE64 = Buffer.from(PDF).toString("base64");

let world: Scenario;
let dir: string;
const saved = { ...process.env };

beforeAll(async () => {
  await migrateTestDb();
  dir = await mkdtemp(path.join(tmpdir(), "floc-bookings-port-"));
});
afterAll(async () => {
  process.env = { ...saved };
  await rm(dir, { recursive: true, force: true });
});
beforeEach(async () => {
  process.env.FLOC_FILES_DIR = dir;
  process.env.FLOC_INBOUND_DOMAIN = "in.floc.test";
  process.env.RESEND_WEBHOOK_SECRET = "whsec_x";
  await resetDb();
  world = await seedScenario();
});

const stay = { kind: "hotel", name: "Casa do Sol", checkIn: "2027-03-04", checkOut: "2027-03-07", reference: null } as const;

describe("the Bookings area", () => {
  it("gives the viewer's files, their trips, the space and the address", async () => {
    await bookingsPort.uploadWaitingBooking(world.member, { name: "Hotel.pdf", mimeType: "application/pdf", contentBase64: BASE64 });
    const area = await bookingsPort.bookingsArea(world.member);
    expect(area.files).toHaveLength(1);
    expect(area.files[0]).toMatchObject({ name: "Hotel.pdf", booking: null, daysLeft: 7 });
    expect(area.trips).toEqual([{ id: world.ours.id, name: "Ours" }]);
    expect(area).toMatchObject({ address: "bookings@in.floc.test", canUpload: true, usage: { usedBytes: 8 } });
    expect(await bookingsPort.waitingBookingCount(world.member)).toBe(1);
    expect((await bookingsPort.bookingsArea(world.admin)).files).toEqual([]);
  });

  it("shows what Floc read to a Pro viewer only", async () => {
    await saveWaitingBooking(world.member, { name: "Stay.pdf", mimeType: "application/pdf", bytes: PDF, details: stay });
    expect((await bookingsPort.bookingsArea(world.member)).files[0].booking).toBeNull();
    await givePro(world.member);
    expect((await bookingsPort.bookingsArea(world.member)).files[0].booking).toMatchObject({ name: "Casa do Sol" });
  });

  it("refuses an empty or oversized upload, and any upload with no volume", async () => {
    const file = { name: "a.pdf", mimeType: "application/pdf" };
    expect(await bookingsPort.uploadWaitingBooking(world.member, { ...file, contentBase64: "" })).toBe("That file is empty");
    expect(await bookingsPort.uploadWaitingBooking(world.member, { ...file, contentBase64: "A".repeat(12 * 1024 * 1024) })).toBe("Files are capped at 8 MB");
    delete process.env.FLOC_FILES_DIR;
    expect(await bookingsPort.uploadWaitingBooking(world.member, { ...file, contentBase64: BASE64 })).toBe("File storage is not set up");
    expect(await bookingsPort.bookingsArea(world.member)).toMatchObject({ canUpload: false, address: null });
  });

  it("places and removes only the viewer's own file", async () => {
    await bookingsPort.uploadWaitingBooking(world.member, { name: "One.pdf", mimeType: "application/pdf", contentBase64: BASE64 });
    await bookingsPort.uploadWaitingBooking(world.member, { name: "Two.pdf", mimeType: "application/pdf", contentBase64: BASE64 });
    const [first, second] = (await bookingsPort.bookingsArea(world.member)).files;

    expect(await bookingsPort.placeWaitingBooking(world.admin, first.id, world.ours.id)).toBe("That file is no longer waiting.");
    expect(await bookingsPort.placeWaitingBooking(world.member, first.id, world.theirs.id)).toBe("Choose one of your trips.");
    expect(await bookingsPort.placeWaitingBooking(world.member, first.id, world.ours.id)).toBeNull();
    expect((await db.select().from(document).all())[0]).toMatchObject({ tripId: world.ours.id, ownerId: world.member });

    await bookingsPort.removeWaitingBooking(world.admin, second.id);
    expect(await bookingsPort.waitingBookingCount(world.member)).toBe(1);
    await bookingsPort.removeWaitingBooking(world.member, second.id);
    expect(await bookingsPort.waitingBookingCount(world.member)).toBe(0);
  });
});
