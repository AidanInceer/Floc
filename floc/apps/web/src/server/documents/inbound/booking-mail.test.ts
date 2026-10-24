/**
 * A forwarded booking email (#328, ADR-027). The sender is the only proof of
 * who it is from, so every refusal answers the same way whether the trip is
 * missing or the sender is not on it (rule 5).
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { document } from "@/db/schema";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { receiveBookingMail, type InboundAttachment } from "./booking-mail";
import { inboundAddress } from "./inbound-address";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const pdf = (filename = "Ryanair booking.pdf"): InboundAttachment => ({
  filename, contentType: "application/pdf", inline: false, sizeBytes: 8, bytes: PDF,
});

let world: Scenario;
let dir: string;
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
});

function mail(over: { from?: string; to?: string[]; attachments?: InboundAttachment[] } = {}) {
  const attachments = over.attachments ?? [pdf()];
  const send = vi.fn().mockResolvedValue(undefined);
  const loadAttachments = vi.fn().mockResolvedValue(attachments);
  const run = () =>
    receiveBookingMail(
      {
        from: over.from ?? `Mo <${world.member}@example.test>`,
        to: over.to ?? [inboundAddress(world.ours.id)!],
        subject: "Your booking",
      },
      { loadAttachments, send },
    );
  return { run, send, loadAttachments };
}

const files = () => db.select().from(document).all();

describe("a member forwards a booking", () => {
  it("files the attachment as theirs, under Other, by its own name", async () => {
    const { run, send } = mail();
    await run();

    const [file] = await files();
    expect(file).toMatchObject({
      tripId: world.ours.id,
      uploadedBy: world.member,
      ownerId: world.member,
      name: "Ryanair booking.pdf",
      category: "other",
      mimeType: "application/pdf",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("files every allowed attachment", async () => {
    const { run } = mail({
      attachments: [pdf("Outbound.pdf"), { filename: "Pass.png", contentType: "image/png", inline: false, sizeBytes: 8, bytes: PNG }],
    });
    await run();
    expect((await files()).map((f) => f.name).sort()).toEqual(["Outbound.pdf", "Pass.png"]);
  });

  it("matches the sender's address whatever its case", async () => {
    const { run } = mail({ from: `${world.member.toUpperCase()}@EXAMPLE.TEST` });
    await run();
    expect(await files()).toHaveLength(1);
  });

  it("leaves out logos drawn inside the email", async () => {
    const { run, send } = mail({
      attachments: [pdf(), { filename: "logo.png", contentType: "image/png", inline: true, sizeBytes: 8, bytes: PNG }],
    });
    await run();
    expect((await files()).map((f) => f.name)).toEqual(["Ryanair booking.pdf"]);
    expect(send).not.toHaveBeenCalled();
  });

  it("saves nothing and says so when there is no attachment", async () => {
    const { run, send } = mail({ attachments: [] });
    await run();
    expect(await files()).toHaveLength(0);
    expect(send).toHaveBeenCalledOnce();
    const [[reply]] = send.mock.calls;
    expect(reply[0].to).toBe(`${world.member}@example.test`);
    expect(reply[0].subject).toBe("Nothing was saved to Ours");
  });

  it("names a file it could not take, and keeps the rest", async () => {
    const { run, send } = mail({
      attachments: [pdf(), { filename: "booking.docx", contentType: "application/msword", inline: false, sizeBytes: 8, bytes: PDF }],
    });
    await run();
    expect(await files()).toHaveLength(1);
    const [[reply]] = send.mock.calls;
    expect(reply[0].lines.join(" ")).toContain("booking.docx");
  });

  it("says why a file left behind before download was refused", async () => {
    const { run, send } = mail({
      attachments: [{ filename: "scan.pdf", contentType: "application/pdf", inline: false, sizeBytes: 20 * 1024 * 1024, bytes: null }],
    });
    await run();
    expect(await files()).toHaveLength(0);
    const [[reply]] = send.mock.calls;
    expect(reply[0].lines).toContain("scan.pdf: Files are capped at 8 MB");
  });
});

describe("a refusal", () => {
  async function refusedWith(over: Parameters<typeof mail>[0]) {
    const { run, send, loadAttachments } = mail(over);
    await run();
    expect(await files()).toHaveLength(0);
    expect(loadAttachments).not.toHaveBeenCalled();
    const [[reply]] = send.mock.calls;
    return reply[0];
  }

  it("answers someone not on the trip, and never downloads their files", async () => {
    const reply = await refusedWith({ from: `${world.outsider}@example.test` });
    expect(reply.subject).toBe("That address isn't on one of your trips");
  });

  it("answers an address nobody has, in the same words (rule 5)", async () => {
    const reply = await refusedWith({ to: ["trip-999-aaaaaaaaaaaa@in.floc.test"] });
    expect(reply.subject).toBe("That address isn't on one of your trips");
  });

  it("answers a sender with no Floc account, in the same words", async () => {
    const reply = await refusedWith({ from: "stranger@example.test" });
    expect(reply.subject).toBe("That address isn't on one of your trips");
  });
});
