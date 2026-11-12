/** A removed file waits a week in the archive, restorable, before its bytes go (ADR-048). Against a real database and a real folder. */
import { eq } from "drizzle-orm";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { FREE_TRIP_STORAGE_BYTES } from "@floc/core/documents/documents";

import { db, schema } from "@/db";
import { findTripAccess, type TripAccess } from "@/server/access";
import { eraseAccount } from "@/server/auth/erase-account";
import { removeDocument, saveDocument } from "@/server/documents/document-save";
import { listDocuments } from "@/server/documents/documents";
import { migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { archivedFiles, purgeArchivedFiles, restoreDocument } from "./archive";

vi.mock("@/server/calendar/calendar-import", () => ({ revokeGoogleGrant: vi.fn() }));

let world: Scenario;
const previousDir = process.env.FLOC_FILES_DIR;
const DAY = 24 * 60 * 60 * 1000;
const PDF = new TextEncoder().encode("%PDF-1.7");

beforeAll(migrateTestDb);
afterAll(() => {
  process.env.FLOC_FILES_DIR = previousDir;
});
beforeEach(async () => {
  process.env.FLOC_FILES_DIR = await mkdtemp(path.join(tmpdir(), "floc-files-"));
  await resetDb();
  world = await seedScenario();
});

const as = async (userId: string): Promise<TripAccess> => (await findTripAccess(world.ours.id, userId))!;
const onDisk = () => readdir(process.env.FLOC_FILES_DIR!);

async function upload(userId: string, name: string, shared = true): Promise<number> {
  const refusal = await saveDocument(await as(userId), { name, mimeType: "application/pdf", bytes: PDF, category: "travel", shared });
  expect(refusal).toBeNull();
  return (await listDocuments(world.ours.id, userId)).find((d) => d.name === name)!.id;
}

const archivedDaysAgo = (id: number, days: number) =>
  db.update(schema.document).set({ deletedAt: new Date(Date.now() - days * DAY) }).where(eq(schema.document.id, id));

const resize = (id: number, sizeBytes: number) =>
  db.update(schema.document).set({ sizeBytes }).where(eq(schema.document.id, id));

describe("removing a file", () => {
  it("takes it off the trip and keeps its bytes", async () => {
    const id = await upload(world.member, "ferry.pdf");
    await removeDocument(await as(world.admin), id);

    expect(await listDocuments(world.ours.id, world.member)).toEqual([]);
    expect(await onDisk()).toHaveLength(1);
  });

  it("shows a shared file in every member's archive", async () => {
    const id = await upload(world.member, "ferry.pdf");
    await removeDocument(await as(world.member), id);

    const [file] = await archivedFiles(await as(world.admin));
    expect(file).toMatchObject({ id, name: "ferry.pdf", ownerId: null });
    expect(file.archivedAt).toBeInstanceOf(Date);
  });

  it("shows a private file in its owner's archive only", async () => {
    const id = await upload(world.member, "passport.pdf", false);
    await removeDocument(await as(world.member), id);

    expect((await archivedFiles(await as(world.member))).map((f) => f.id)).toEqual([id]);
    expect(await archivedFiles(await as(world.admin))).toEqual([]);
  });
});

describe("restoring a file", () => {
  it("puts it back on the trip, for any member who could see it", async () => {
    const id = await upload(world.member, "ferry.pdf");
    await removeDocument(await as(world.member), id);

    expect(await restoreDocument(await as(world.admin), id)).toBeNull();
    expect((await listDocuments(world.ours.id, world.member)).map((d) => d.id)).toEqual([id]);
    expect(await archivedFiles(await as(world.member))).toEqual([]);
  });

  it("refuses somebody else's private file, in the words for a file that is not there", async () => {
    const id = await upload(world.member, "passport.pdf", false);
    await removeDocument(await as(world.member), id);

    expect(await restoreDocument(await as(world.admin), id)).toBe("That file is no longer in the archive.");
    expect(await listDocuments(world.ours.id, world.member)).toEqual([]);
  });

  it("refuses once the week is up", async () => {
    const id = await upload(world.member, "ferry.pdf");
    await removeDocument(await as(world.member), id);
    await archivedDaysAgo(id, 8);

    expect(await archivedFiles(await as(world.member))).toEqual([]);
    expect(await restoreDocument(await as(world.member), id)).toBe("That file is no longer in the archive.");
  });

  it("refuses when the trip has no room for it, naming the space", async () => {
    const id = await upload(world.member, "ferry.pdf");
    await removeDocument(await as(world.member), id);
    const full = await upload(world.member, "scan.pdf");
    await resize(full, FREE_TRIP_STORAGE_BYTES);

    expect(await restoreDocument(await as(world.member), id)).toMatch(/used all of its 200 MB/);
  });
});

describe("the end of the week", () => {
  it("deletes the bytes of files past it and leaves the rest", async () => {
    const old = await upload(world.member, "old.pdf");
    const recent = await upload(world.member, "recent.pdf");
    const live = await upload(world.member, "live.pdf");
    await removeDocument(await as(world.member), old);
    await removeDocument(await as(world.member), recent);
    await archivedDaysAgo(old, 8);

    expect(await purgeArchivedFiles()).toBe(1);

    expect(await onDisk()).toHaveLength(2);
    expect((await archivedFiles(await as(world.member))).map((f) => f.id)).toEqual([recent]);
    expect((await listDocuments(world.ours.id, world.member)).map((d) => d.id)).toEqual([live]);
  });
});

describe("erasing an account", () => {
  it("deletes the bytes of that person's archived private files at once", async () => {
    const mine = await upload(world.member, "passport.pdf", false);
    const shared = await upload(world.member, "ferry.pdf");
    await removeDocument(await as(world.member), mine);
    await removeDocument(await as(world.member), shared);

    await eraseAccount(world.member);

    expect(await onDisk()).toHaveLength(1);
    expect((await archivedFiles(await as(world.admin))).map((f) => f.id)).toEqual([shared]);
  });
});

describe("an archive bigger than the trip's own space", () => {
  it("lets its oldest file go early", async () => {
    const first = await upload(world.member, "first.pdf");
    const second = await upload(world.member, "second.pdf");
    await resize(first, FREE_TRIP_STORAGE_BYTES);
    await removeDocument(await as(world.member), first);
    await archivedDaysAgo(first, 2);

    await removeDocument(await as(world.member), second);

    expect((await archivedFiles(await as(world.member))).map((f) => f.id)).toEqual([second]);
    expect(await onDisk()).toHaveLength(1);
  });
});
