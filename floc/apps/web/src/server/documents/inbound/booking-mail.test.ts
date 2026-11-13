/**
 * A booking forwarded to the shared address (#559, ADR-050). The sender is the only proof of who it is from,
 * and nothing in the mail may reach past the sender's own files and trips.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { activity, bookingInbox, document, inboundMail, notification, trip, user } from "@/db/schema";
import { mailCap } from "@/server/auth/mail/mail-cap";
import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { receiveBookingMail, type InboundAttachment } from "./booking-mail";
import type { ReceivedMail } from "./resend-received";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ADDRESS = "bookings@in.floc.test";

const pdf = (filename = "Ryanair booking.pdf"): InboundAttachment => ({
  filename, contentType: "application/pdf", inline: false, sizeBytes: 8, bytes: PDF,
});

const flightHtml = (date: string) =>
  `<script type="application/ld+json">${JSON.stringify({
    "@type": "FlightReservation",
    reservationNumber: "RJ3KLM",
    reservationFor: {
      flightNumber: "FR1234",
      departureAirport: { iataCode: "STN" },
      arrivalAirport: { iataCode: "OPO" },
      departureTime: `${date}T06:25:00`,
    },
  })}</script>`;

let world: Scenario;
let dir: string;
let mailNumber = 0;
const env = { files: process.env.FLOC_FILES_DIR, domain: process.env.FLOC_INBOUND_DOMAIN };

beforeAll(async () => {
  await migrateTestDb();
  dir = await mkdtemp(path.join(tmpdir(), "floc-inbound-"));
  process.env.FLOC_FILES_DIR = dir;
  process.env.FLOC_INBOUND_DOMAIN = "in.floc.test";
});
afterAll(async () => {
  for (const [name, value] of [["FLOC_FILES_DIR", env.files], ["FLOC_INBOUND_DOMAIN", env.domain]] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  await rm(dir, { recursive: true, force: true });
});
beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  await db.update(user).set({ emailVerified: true });
  await db.update(trip).set({ startDate: "2027-03-04", endDate: "2027-03-08" }).where(eq(trip.id, world.ours.id));
});

type Over = {
  emailId?: string;
  from?: string;
  to?: string[];
  attachments?: InboundAttachment[];
  received?: Partial<ReceivedMail>;
  barcodes?: string[];
  replies?: ReturnType<typeof mailCap>;
};

function mail(over: Over = {}) {
  mailNumber += 1;
  const send = vi.fn().mockResolvedValue(undefined);
  const loadAttachments = vi.fn().mockResolvedValue(over.attachments ?? [pdf()]);
  const received = vi.fn().mockResolvedValue({ proven: true, html: null, automated: false, severalFrom: false, ...over.received });
  const barcodes = vi.fn().mockResolvedValue(over.barcodes ?? []);
  const run = () =>
    receiveBookingMail(
      {
        emailId: over.emailId ?? `mail-${mailNumber}`,
        from: over.from ?? `Mo <${world.member}@example.test>`,
        to: over.to ?? [ADDRESS],
      },
      { loadAttachments, send, received, barcodes, replies: over.replies ?? mailCap({ perDay: 3 }) },
    );
  return { run, send, loadAttachments, received, barcodes };
}

const tripFiles = () => db.select().from(document).all();
const waiting = () => db.select().from(bookingInbox).all();

describe("a member forwards a booking to the shared address", () => {
  it("keeps the file waiting in their Bookings area, by its own name", async () => {
    const { run, send } = mail();
    await run();

    expect(await tripFiles()).toHaveLength(0);
    const [file] = await waiting();
    expect(file).toMatchObject({ userId: world.member, name: "Ryanair booking.pdf", category: "other", mimeType: "application/pdf" });
    expect(send).not.toHaveBeenCalled();
  });

  it("tells them in the inbox that a booking is waiting", async () => {
    await mail().run();
    const [row] = await db.select().from(activity).all();
    expect(row).toMatchObject({ kind: "booking_waiting", actorId: world.member, tripId: null, href: "/bookings" });
    const [note] = await db.select().from(notification).all();
    expect(note).toMatchObject({ userId: world.member, loud: false });
  });

  it("keeps every allowed attachment, and leaves out logos drawn inside the email", async () => {
    await mail({
      attachments: [
        pdf("Outbound.pdf"),
        { filename: "Pass.png", contentType: "image/png", inline: false, sizeBytes: 8, bytes: PNG },
        { filename: "logo.png", contentType: "image/png", inline: true, sizeBytes: 8, bytes: PNG },
      ],
    }).run();
    expect((await waiting()).map((f) => f.name).sort()).toEqual(["Outbound.pdf", "Pass.png"]);
  });

  it("matches the sender's address whatever its case", async () => {
    await mail({ from: `${world.member.toUpperCase()}@EXAMPLE.TEST` }).run();
    expect(await waiting()).toHaveLength(1);
  });

  it("keeps no more files from one mail than the limit", async () => {
    await mail({ attachments: Array.from({ length: 14 }, (_, i) => pdf(`Ticket ${i}.pdf`)) }).run();
    expect(await waiting()).toHaveLength(10);
  });

  it("saves nothing and says so when there is no attachment", async () => {
    const { run, send } = mail({ attachments: [] });
    await run();
    expect(await waiting()).toHaveLength(0);
    const [[reply]] = send.mock.calls;
    expect(reply[0].to).toBe(`${world.member}@example.test`);
    expect(reply[0].subject).toBe("Nothing was saved from your email");
    expect(await db.select().from(activity).all()).toHaveLength(0);
  });

  it("names a file it could not take, cleaned, and keeps the rest", async () => {
    const { run, send } = mail({
      attachments: [pdf(), { filename: "../boo<b>king.docx", contentType: "application/msword", inline: false, sizeBytes: 8, bytes: PDF }],
    });
    await run();
    expect(await waiting()).toHaveLength(1);
    const [[reply]] = send.mock.calls;
    const text = reply[0].lines.join(" ");
    expect(text).toContain("king.docx");
    expect(text).not.toContain("../");
  });

  it("says why a file left behind before download was refused", async () => {
    const { run, send } = mail({
      attachments: [{ filename: "scan.pdf", contentType: "application/pdf", inline: false, sizeBytes: 20 * 1024 * 1024, bytes: null }],
    });
    await run();
    const [[reply]] = send.mock.calls;
    expect(reply[0].lines).toContain("scan.pdf: Files are capped at 8 MB");
  });
});

describe("reading the booking, for a Pro member", () => {
  beforeEach(() => givePro(world.member));

  it("keeps what the mail's schema.org data says, filed under Travel", async () => {
    await mail({ received: { html: flightHtml("2027-09-20") } }).run();
    const [file] = await waiting();
    expect(file.category).toBe("travel");
    expect(JSON.parse(file.bookingDetails!)).toMatchObject({ kind: "flight", flightNumber: "FR 1234", from: "STN", to: "OPO", date: "2027-09-20" });
  });

  it("falls back to a boarding pass barcode", async () => {
    const { run, barcodes } = mail({ barcodes: ["M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 100"] });
    await run();
    expect(barcodes).toHaveBeenCalledOnce();
    const [file] = await waiting();
    expect(JSON.parse(file.bookingDetails!)).toMatchObject({ kind: "flight", flightNumber: "AC 834", from: "YUL", to: "FRA" });
  });

  it("keeps the file with nothing read when the mail says nothing it can check", async () => {
    await mail({ received: { html: "<p>Thanks</p><script>alert(1)</script>" }, barcodes: ["https://evil.example/x"] }).run();
    const [file] = await waiting();
    expect(file).toMatchObject({ category: "other", bookingDetails: null });
  });
});

describe("finding the trip", () => {
  it("files a Pro member's booking on the one trip whose dates hold it, private to them", async () => {
    await givePro(world.member);
    await mail({ received: { html: flightHtml("2027-03-04") } }).run();

    expect(await waiting()).toHaveLength(0);
    const [file] = await tripFiles();
    expect(file).toMatchObject({ tripId: world.ours.id, ownerId: world.member, uploadedBy: world.member, category: "travel" });
    expect(JSON.parse(file.bookingDetails!)).toMatchObject({ flightNumber: "FR 1234" });
    const [row] = await db.select().from(activity).all();
    expect(row).toMatchObject({ kind: "booking_filed", tripId: world.ours.id, href: `/trip/${world.ours.id}/files` });
  });

  it("leaves a free member's booking waiting and reads nothing from it: reading is Pro, and the readers never run", async () => {
    const { run, barcodes } = mail({ received: { html: flightHtml("2027-03-04") }, barcodes: ["M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 100"] });
    await run();
    expect(await tripFiles()).toHaveLength(0);
    expect((await waiting())[0]).toMatchObject({ category: "other", bookingDetails: null });
    expect(barcodes).not.toHaveBeenCalled();
  });

  it("leaves it waiting when no trip of theirs holds the date", async () => {
    await givePro(world.member);
    await mail({ received: { html: flightHtml("2027-09-20") } }).run();
    expect(await tripFiles()).toHaveLength(0);
    expect(await waiting()).toHaveLength(1);
  });

  it("never files on a trip the sender is not on, whatever its dates", async () => {
    await givePro(world.member);
    await db.update(trip).set({ startDate: "2027-09-18", endDate: "2027-09-25" }).where(eq(trip.id, world.theirs.id));
    await mail({ received: { html: flightHtml("2027-09-20") } }).run();
    expect(await tripFiles()).toHaveLength(0);
    expect((await waiting())[0].userId).toBe(world.member);
  });
});

describe("mail that saves nothing", () => {
  async function nothingSaved(over: Over) {
    const sent = mail(over);
    await sent.run();
    expect(await waiting()).toHaveLength(0);
    expect(await tripFiles()).toHaveLength(0);
    expect(sent.loadAttachments).not.toHaveBeenCalled();
    return sent;
  }

  it("ignores an old per-trip address, without a reply", async () => {
    const { send, received } = await nothingSaved({ to: [`trip-${world.ours.id}-aaaaaaaaaaaa@in.floc.test`] });
    expect(received).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("says nothing to a sender with no Floc account: a forged From would have Floc mail a stranger", async () => {
    const { send, received } = await nothingSaved({ from: "stranger@example.test" });
    expect(received).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("treats an account that never confirmed its address as no account", async () => {
    await db.update(user).set({ emailVerified: false }).where(eq(user.id, world.member));
    const { send, received } = await nothingSaved({});
    expect(received).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps nothing from a From the sending server did not prove, and tells the real owner", async () => {
    const { send } = await nothingSaved({ received: { proven: false } });
    const [[reply]] = send.mock.calls;
    expect(reply[0].to).toBe(`${world.member}@example.test`);
    expect(reply[0].subject).toBe("We couldn't confirm that email came from you");
  });

  it("refuses a From line that names two addresses", async () => {
    const { send, received } = await nothingSaved({ from: `attacker@evil.test, Mo <${world.member}@example.test>` });
    expect(received).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses a mail whose headers carry more than one From, without a reply", async () => {
    const { send } = await nothingSaved({ received: { severalFrom: true } });
    expect(send).not.toHaveBeenCalled();
  });

  it("does not answer an auto-reply or a list mail, so no mail loop can start", async () => {
    const { send } = await nothingSaved({ received: { proven: false, automated: true } });
    expect(send).not.toHaveBeenCalled();
  });

  it("processes a webhook delivered twice only once", async () => {
    await mail({ emailId: "same-mail" }).run();
    const again = mail({ emailId: "same-mail" });
    await again.run();
    expect(await waiting()).toHaveLength(1);
    expect(again.received).not.toHaveBeenCalled();
  });

  it("stops a sender past the hourly limit, without a reply", async () => {
    await db.insert(inboundMail).values(Array.from({ length: 20 }, (_, i) => ({ emailId: `old-${i}`, userId: world.member })));
    const { send } = await nothingSaved({});
    expect(send).not.toHaveBeenCalled();
  });

  it("does not count unproven mail against the member, so a forger cannot use up their hour", async () => {
    for (let i = 0; i < 25; i += 1) await mail({ received: { proven: false } }).run();
    const real = mail();
    await real.run();
    expect(await waiting()).toHaveLength(1);
  });

  it("gives the claim back when Resend fails, so the retry is not dropped as a replay", async () => {
    const failing = mail({ emailId: "flaky" });
    failing.received.mockRejectedValueOnce(new Error("Resend read the received email with 500"));
    await expect(failing.run()).rejects.toThrow("500");
    await mail({ emailId: "flaky" }).run();
    expect(await waiting()).toHaveLength(1);
  });

  it("answers one sender only a few times a day", async () => {
    const sends = [];
    const replies = mailCap({ perDay: 3 });
    for (let i = 0; i < 5; i += 1) {
      const sent = mail({ replies, received: { proven: false } });
      await sent.run();
      sends.push(sent.send.mock.calls.length);
    }
    expect(sends).toEqual([1, 1, 1, 0, 0]);
  });
});
