/**
 * Documents (ticket 239). The two things worth a test are the two that are not
 * obvious from reading a row: a private file is invisible to everyone but its
 * owner, and a shared file is any member's to remove.
 */
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  expectNotFound,
  migrateTestDb,
  resetDb,
  seedScenario,
  signIn,
  type Scenario,
  givePro,
} from "@/test/db";
import { requireTripAccess } from "@/server/access";
import {
  insertDocument,
  listDocuments,
  liveDocument,
  softDeleteDocument,
  usedBytes,
} from "@/server/documents/documents";
import { FREE_TRIP_STORAGE_BYTES, PRO_TRIP_STORAGE_BYTES } from "@floc/core/documents/documents";
import { storageUsage } from "@/server/documents/storage-quota";
import { removeDocument, renameDocument, setCategory, uploadDocument } from "./actions";

let world: Scenario;
const previousDir = process.env.FLOC_FILES_DIR;

beforeAll(migrateTestDb);

afterAll(() => {
  process.env.FLOC_FILES_DIR = previousDir;
});

beforeEach(async () => {
  // A fresh volume each time, so "what is on the disk?" is a question about
  // this test only.
  process.env.FLOC_FILES_DIR = await mkdtemp(
    path.join(tmpdir(), "floc-files-"),
  );
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

function form(
  scope: "shared" | "private",
  name = "booking.pdf",
  category = "travel",
) {
  const data = new FormData();
  data.set("file", new File(["%PDF-1.7"], name, { type: "application/pdf" }));
  data.set("scope", scope);
  data.set("category", category);
  return data;
}

describe("uploadDocument", () => {
  it("shares a file with the trip", async () => {
    await uploadDocument(world.ours.id, form("shared"));

    const docs = await listDocuments(world.ours.id, world.admin);
    expect(docs.map((d) => [d.name, d.ownerId])).toEqual([
      ["booking.pdf", null],
    ]);
  });

  it("keeps a private file out of another member's list", async () => {
    await uploadDocument(world.ours.id, form("private", "boarding pass.pdf"));

    expect(await listDocuments(world.ours.id, world.admin)).toEqual([]);
    expect(
      (await listDocuments(world.ours.id, world.member)).map((d) => d.name),
    ).toEqual(["boarding pass.pdf"]);
  });

  it("refuses a page dressed up as a PDF, and writes nothing", async () => {
    const data = new FormData();
    data.set("file", new File(["<html><script>"], "booking.pdf", { type: "application/pdf" }));
    data.set("scope", "shared");

    expect(await uploadDocument(world.ours.id, data)).toEqual({
      error: "Only PDFs and images can go here",
    });
    expect(await readdir(process.env.FLOC_FILES_DIR!)).toEqual([]);
  });

  it("refuses a type that is not a PDF or an image, and writes nothing", async () => {
    const data = new FormData();
    data.set("file", new File(["#!/bin/sh"], "run.sh", { type: "text/x-sh" }));
    data.set("scope", "shared");

    expect(await uploadDocument(world.ours.id, data)).toEqual({
      error: "Only PDFs and images can go here",
    });
    expect(await readdir(process.env.FLOC_FILES_DIR!)).toEqual([]);
  });

  it("refuses a trip the viewer is not on", async () => {
    await expectNotFound(() => uploadDocument(world.theirs.id, form("shared")));
  });
});

describe("removeDocument", () => {
  it("lets a member who did not upload it remove a shared file", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    signIn(world.admin);
    await removeDocument(world.ours.id, doc.id);

    expect(await listDocuments(world.ours.id, world.member)).toEqual([]);
  });

  it("cannot reach another member's private file", async () => {
    await uploadDocument(world.ours.id, form("private"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    signIn(world.admin);
    await expectNotFound(() => removeDocument(world.ours.id, doc.id));
  });

  it("takes the file out of the list and off the disk", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    await removeDocument(world.ours.id, doc.id);

    expect(await listDocuments(world.ours.id, world.member)).toEqual([]);
    expect(await readdir(process.env.FLOC_FILES_DIR!)).toEqual([]);
  });
});

describe("access.document", () => {
  it("answers not-found for another member's private file", async () => {
    await uploadDocument(world.ours.id, form("private"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    signIn(world.admin);
    const access = await requireTripAccess(world.ours.id);
    await expectNotFound(() => access.document(doc.id));
  });
});

describe("setCategory", () => {
  it("re-files a shared document for anyone on the trip", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);
    expect(doc.category).toBe("travel");

    // Somebody else on the trip moves it — filing is housekeeping, not authorship.
    signIn(world.admin);
    const move = new FormData();
    move.set("category", "stay");
    await setCategory(world.ours.id, doc.id, move);

    expect((await listDocuments(world.ours.id, world.admin))[0].category).toBe(
      "stay",
    );
  });

  it("files an unknown heading under other rather than refusing", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    const move = new FormData();
    move.set("category", "not-a-heading");
    await setCategory(world.ours.id, doc.id, move);

    expect((await listDocuments(world.ours.id, world.member))[0].category).toBe(
      "other",
    );
  });

  it("refuses another member's private file", async () => {
    await uploadDocument(world.ours.id, form("private"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    signIn(world.admin);
    const move = new FormData();
    move.set("category", "stay");
    await expectNotFound(() => setCategory(world.ours.id, doc.id, move));
  });
});

describe("renameDocument (#364)", () => {
  it("gives a file a clear name and leaves the stored file alone", async () => {
    await uploadDocument(world.ours.id, form("shared", "IMG_2231.pdf"));
    const [before] = await listDocuments(world.ours.id, world.member);
    const stored = (await liveDocument(before.id))!.storageKey;
    const disk = await readdir(process.env.FLOC_FILES_DIR!, { recursive: true });

    signIn(world.admin);
    expect(await renameDocument(world.ours.id, before.id, "  Ferry to Mull ")).toEqual({});

    const [after] = await listDocuments(world.ours.id, world.admin);
    expect(after).toMatchObject({ id: before.id, name: "Ferry to Mull.pdf" });
    expect((await liveDocument(before.id))!.storageKey).toBe(stored);
    expect(await readdir(process.env.FLOC_FILES_DIR!, { recursive: true })).toEqual(disk);
  });

  it("refuses a blank name as a form error", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    expect(await renameDocument(world.ours.id, doc.id, "   ")).toEqual({ error: "Give the file a name." });
    expect((await listDocuments(world.ours.id, world.member))[0].name).toBe("booking.pdf");
  });

  it("cannot reach another member's private file", async () => {
    await uploadDocument(world.ours.id, form("private"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    signIn(world.admin);
    await expectNotFound(() => renameDocument(world.ours.id, doc.id, "Mine now"));
  });
});

describe("the trip's storage quota (#285)", () => {
  const bigFile = (sizeBytes: number) =>
    insertDocument({
      tripId: world.ours.id,
      uploadedBy: world.admin,
      ownerId: null,
      name: "scans.pdf",
      storageKey: `seeded-${sizeBytes}`,
      mimeType: "application/pdf",
      sizeBytes,
      category: "other",
    });

  it("takes a file that fits in what is left", async () => {
    await bigFile(FREE_TRIP_STORAGE_BYTES - 1024);
    expect(await uploadDocument(world.ours.id, form("shared"))).toBeUndefined();
    expect(await usedBytes(world.ours.id)).toBe(FREE_TRIP_STORAGE_BYTES - 1024 + "%PDF-1.7".length);
  });

  it("refuses one past the quota as a form error naming the space left, and writes nothing", async () => {
    await bigFile(FREE_TRIP_STORAGE_BYTES - 4);

    expect(await uploadDocument(world.ours.id, form("shared"))).toEqual({
      error: "This trip has 4 B of its 200 MB left, and that file is 8 B.",
    });
    expect(await listDocuments(world.ours.id, world.member)).toHaveLength(1);
  });

  it("gives a removed file's bytes back", async () => {
    await bigFile(FREE_TRIP_STORAGE_BYTES);
    const [full] = await listDocuments(world.ours.id, world.member);
    expect((await uploadDocument(world.ours.id, form("shared")))?.error).toMatch(/used all of its 200 MB/);

    await softDeleteDocument(full.id);

    expect(await usedBytes(world.ours.id)).toBe(0);
    expect(await uploadDocument(world.ours.id, form("shared"))).toBeUndefined();
  });

  it("counts every member's private files, not only the viewer's", async () => {
    await uploadDocument(world.ours.id, form("private"));
    signIn(world.admin);
    expect(await usedBytes(world.ours.id)).toBe("%PDF-1.7".length);
  });

  it("lifts the quota for a trip with a Pro member on it", async () => {
    await givePro(world.admin);
    await bigFile(FREE_TRIP_STORAGE_BYTES);

    expect(await uploadDocument(world.ours.id, form("shared"))).toBeUndefined();
    expect(await storageUsage(world.ours.id)).toEqual({
      usedBytes: FREE_TRIP_STORAGE_BYTES + "%PDF-1.7".length,
      quotaBytes: PRO_TRIP_STORAGE_BYTES,
    });
  });
});
