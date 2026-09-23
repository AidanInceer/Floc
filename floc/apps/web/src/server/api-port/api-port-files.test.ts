/**
 * The files half of the port, against a real database (#239, #296).
 *
 * WHAT THESE ARE FOR. The web posts a multipart form and the phone posts
 * base64, so the two arrive by different roads — and every refusal along the
 * way (the type list, the 8 MB cap, the trip ceiling) has to be the same "no"
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

import { FREE_TRIP_STORAGE_BYTES } from "@floc/core/documents/documents";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";
import { webPort } from "@/server/api-port/api-port";

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
  it("caps encoded input even when base64 decoding would discard it", async () => {
    const refusal = await webPort.uploadFile(world.admin, world.ours.id, {
      name: "huge.png", mimeType: "image/png", category: "other", shared: true,
      contentBase64: " ".repeat(Math.ceil(8 * 1024 * 1024 / 3) * 4 + 1),
    });
    expect(refusal).toBe("Files are capped at 8 MB");
  });

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
    // 9 MB of base64 zeroes decodes past the 8 MB cap. Nothing in the input
    // says how big it is, so the only way to know is to decode it.
    const tooBig = Buffer.alloc(9 * 1024 * 1024).toString("base64");
    const refusal = await webPort.uploadFile(world.admin, world.ours.id, {
      name: "huge.png",
      mimeType: "image/png",
      contentBase64: tooBig,
      category: "other",
      shared: true,
    });
    expect(refusal).toBe("Files are capped at 8 MB");
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

  it("lets any member remove a shared file, uploader or not", async () => {
    const file = await oneFile();
    await webPort.deleteFile(world.member, world.ours.id, file.id);
    expect(await webPort.listFiles(world.admin, world.ours.id)).toEqual([]);
  });

  it("lets any member re-file it — nothing is lost by moving it", async () => {
    const file = await oneFile();
    await webPort.setFileCategory(world.member, world.ours.id, file.id, "travel");

    const after = await webPort.listFiles(world.member, world.ours.id);
    expect(after[0].category).toBe("travel");
  });

  it("renames it, keeping the extension, and says so in words when the name is empty (#364)", async () => {
    const file = await oneFile();

    expect(await webPort.renameFile(world.member, world.ours.id, file.id, "Ferry to Mull")).toBeNull();
    expect((await webPort.listFiles(world.admin, world.ours.id))[0].name).toBe("Ferry to Mull.png");

    expect(await webPort.renameFile(world.member, world.ours.id, file.id, "\u0007")).toBe("Give the file a name.");
    await expect(webPort.renameFile(world.outsider, world.theirs.id, file.id, "Mine")).rejects.toThrow();
  });

  it("will not touch a file belonging to another trip", async () => {
    const file = await oneFile();
    await expect(
      webPort.setFileCategory(world.outsider, world.theirs.id, file.id, "travel"),
    ).rejects.toThrow();
  });
});

describe("the trip's storage quota (#285)", () => {
  const png = { name: "pass.png", mimeType: "image/png", contentBase64: PNG_BASE64, category: "other" as const, shared: true };

  it("reports what the trip uses against its quota", async () => {
    await webPort.uploadFile(world.admin, world.ours.id, png);
    const pngBytes = Buffer.from(PNG_BASE64, "base64").byteLength;

    expect(await webPort.fileUsage(world.member, world.ours.id)).toEqual({
      usedBytes: pngBytes,
      quotaBytes: FREE_TRIP_STORAGE_BYTES,
    });
    await expect(webPort.fileUsage(world.outsider, world.ours.id)).rejects.toThrow();
  });

  it("refuses the phone's upload past the quota in the same words as the web", async () => {
    await db.insert(schema.document).values({
      tripId: world.ours.id, uploadedBy: world.admin, ownerId: null, name: "scans.pdf",
      storageKey: "seeded", mimeType: "application/pdf", sizeBytes: FREE_TRIP_STORAGE_BYTES, category: "other",
    });

    expect(await webPort.uploadFile(world.admin, world.ours.id, png)).toBe(
      "This trip has used all of its 200 MB. Remove a file to make room.",
    );
  });
});

describe("parking a file on an event", () => {
  /** One shared file on the trip, and its id. */
  async function aFile(name = "ferry.png") {
    await webPort.uploadFile(world.admin, world.ours.id, {
      name,
      mimeType: "image/png",
      contentBase64: PNG_BASE64,
      category: "tickets",
      shared: true,
    });
    const files = await webPort.listFiles(world.admin, world.ours.id);
    return files.find((f) => f.name === name)!.id;
  }

  it("uploads straight onto an event and names it on the row", async () => {
    await webPort.uploadFile(world.admin, world.ours.id, {
      name: "boarding.png",
      mimeType: "image/png",
      contentBase64: PNG_BASE64,
      category: "tickets",
      shared: true,
      dayEventId: world.ours.eventId,
    });

    const [file] = await webPort.listFiles(world.member, world.ours.id);
    expect(file.dayEventId).toBe(world.ours.eventId);
    expect(file.eventTitle).not.toBeNull();
  });

  it("attaches a file that was already on the trip, and detaches it again", async () => {
    const fileId = await aFile();
    expect((await webPort.listFiles(world.admin, world.ours.id))[0].dayEventId).toBeNull();

    // Filing is any member's to do, like the category — not only the uploader's.
    await webPort.attachFileToEvent(world.member, world.ours.id, fileId, world.ours.eventId);
    expect((await webPort.listFiles(world.admin, world.ours.id))[0].dayEventId).toBe(
      world.ours.eventId,
    );

    await webPort.detachFileFromEvent(world.member, world.ours.id, fileId);
    const [loose] = await webPort.listFiles(world.admin, world.ours.id);
    // Detaching leaves the file on the trip — only the tie goes.
    expect(loose.dayEventId).toBeNull();
    expect(loose.name).toBe("ferry.png");
  });

  it("cannot park a file on another trip's event", async () => {
    const fileId = await aFile();
    await expect(
      webPort.attachFileToEvent(world.admin, world.ours.id, fileId, world.theirs.eventId),
    ).rejects.toThrow();
  });
});
