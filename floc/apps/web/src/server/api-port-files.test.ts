/**
 * The files half of the port, against a real database (tickets 239, 296).
 *
 * WHAT THESE ARE FOR. The web posts a multipart form and the phone posts
 * base64, so the two arrive by different roads — and every refusal along the
 * way (the type list, the 10 MB cap, the trip ceiling) has to be the same "no"
 * for the same reason. A second road is exactly where a rule goes missing.
 *
 * THE CAP IS CHECKED ON THE DECODED BYTES. A client says how big its file is;
 * the server must not believe it. That is only testable from this side.
 *
 * WITHOUT A VOLUME THERE IS NOTHING TO WRITE TO (rule 11) — the refusal is a
 * sentence, not a throw, so the screen can print it.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port";

let world: Scenario;

/** A one-pixel PNG. Small, real, and of an allowed type. */
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

beforeAll(async () => {
  await migrateTestDb();
  // A real directory, thrown away with the temp folder — the store refuses to
  // write without one, and a mock would prove nothing about the refusal.
  process.env.FLOC_FILES_DIR = await mkdtemp(path.join(tmpdir(), "floc-files-"));
});

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
});

describe("putting a file on a trip", () => {
  it("takes a PNG and lists it back", async () => {
    const refusal = await webPort.uploadFile(world.admin, world.ours.id, {
      name: "booking.png",
      mimeType: "image/png",
      contentBase64: PNG_BASE64,
      category: "other",
      shared: true,
    });
    expect(refusal).toBeNull();

    const files = await webPort.listFiles(world.admin, world.ours.id);
    expect(files.map((f) => f.name)).toEqual(["booking.png"]);
    // Shared means no owner — that is the whole private/shared line.
    expect(files[0].ownerId).toBeNull();
    expect(files[0].uploaderName).toBe("Ada");
  });

  it("refuses a type that is not a PDF or a picture, in words", async () => {
    const refusal = await webPort.uploadFile(world.admin, world.ours.id, {
      name: "notes.txt",
      mimeType: "text/plain",
      contentBase64: PNG_BASE64,
      category: "other",
      shared: true,
    });
    expect(refusal).toBe("Only PDFs and images can go here");
    expect(await webPort.listFiles(world.admin, world.ours.id)).toEqual([]);
  });

  it("weighs the decoded bytes, not what the client claimed", async () => {
    // 11 MB of base64 zeroes decodes past the 10 MB cap. Nothing in the input
    // says how big it is, so the only way to know is to decode it.
    const tooBig = Buffer.alloc(11 * 1024 * 1024).toString("base64");
    const refusal = await webPort.uploadFile(world.admin, world.ours.id, {
      name: "huge.png",
      mimeType: "image/png",
      contentBase64: tooBig,
      category: "other",
      shared: true,
    });
    expect(refusal).toBe("Files are capped at 10 MB");
  });

  it("refuses a non-member outright, not with a sentence", async () => {
    // A refusal in words is for a mistake. Being in somebody else's trip is
    // not a mistake (rule 5).
    await expect(
      webPort.uploadFile(world.outsider, world.ours.id, {
        name: "x.png",
        mimeType: "image/png",
        contentBase64: PNG_BASE64,
        category: "other",
        shared: true,
      }),
    ).rejects.toThrow();
  });
});

describe("a private file is one person's", () => {
  it("keeps it out of everybody else's list", async () => {
    await webPort.uploadFile(world.admin, world.ours.id, {
      name: "passport.png",
      mimeType: "image/png",
      contentBase64: PNG_BASE64,
      category: "admin",
      shared: false,
    });

    expect(
      (await webPort.listFiles(world.admin, world.ours.id)).map((f) => f.name),
    ).toEqual(["passport.png"]);
    // Not returned flagged — not returned at all.
    expect(await webPort.listFiles(world.member, world.ours.id)).toEqual([]);
  });
});

describe("removing and re-filing", () => {
  async function oneFile() {
    await webPort.uploadFile(world.admin, world.ours.id, {
      name: "hotel.png",
      mimeType: "image/png",
      contentBase64: PNG_BASE64,
      category: "other",
      shared: true,
    });
    return (await webPort.listFiles(world.admin, world.ours.id))[0];
  }

  it("lets the uploader remove it and nobody else", async () => {
    const file = await oneFile();
    await expect(
      webPort.deleteFile(world.member, world.ours.id, file.id),
    ).rejects.toThrow();

    await webPort.deleteFile(world.admin, world.ours.id, file.id);
    expect(await webPort.listFiles(world.admin, world.ours.id)).toEqual([]);
  });

  it("lets any member re-file it — nothing is lost by moving it", async () => {
    const file = await oneFile();
    await webPort.setFileCategory(world.member, world.ours.id, file.id, "travel");

    const after = await webPort.listFiles(world.member, world.ours.id);
    expect(after[0].category).toBe("travel");
  });

  it("will not touch a file belonging to another trip", async () => {
    const file = await oneFile();
    await expect(
      webPort.setFileCategory(world.outsider, world.theirs.id, file.id, "travel"),
    ).rejects.toThrow();
  });
});
