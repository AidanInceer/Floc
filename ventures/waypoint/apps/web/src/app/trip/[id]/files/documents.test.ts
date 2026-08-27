/**
 * Documents (ticket 239). The two things worth a test are the two that are not
 * obvious from reading a row: a private file is invisible to everyone but its
 * owner, and removal belongs to whoever uploaded it.
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
} from "@/test/db";
import { requireTripAccess } from "@/server/access";
import { listDocuments } from "@/server/documents";
import { removeDocument, uploadDocument } from "./actions";

let world: Scenario;
const previousDir = process.env.WAYPOINT_FILES_DIR;

beforeAll(migrateTestDb);

afterAll(() => {
  process.env.WAYPOINT_FILES_DIR = previousDir;
});

beforeEach(async () => {
  // A fresh volume each time, so "what is on the disk?" is a question about
  // this test only.
  process.env.WAYPOINT_FILES_DIR = await mkdtemp(
    path.join(tmpdir(), "waypoint-files-"),
  );
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

function form(scope: "shared" | "private", name = "booking.pdf") {
  const data = new FormData();
  data.set("file", new File([new Uint8Array([1, 2, 3])], name, { type: "application/pdf" }));
  data.set("scope", scope);
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

  it("refuses a type that is not a PDF or an image, and writes nothing", async () => {
    const data = new FormData();
    data.set("file", new File(["#!/bin/sh"], "run.sh", { type: "text/x-sh" }));
    data.set("scope", "shared");

    expect(await uploadDocument(world.ours.id, data)).toEqual({
      error: "Only PDFs and images can go here",
    });
    expect(await readdir(process.env.WAYPOINT_FILES_DIR!)).toEqual([]);
  });

  it("refuses a trip the viewer is not on", async () => {
    await expectNotFound(() => uploadDocument(world.theirs.id, form("shared")));
  });
});

describe("removeDocument", () => {
  it("refuses anyone but the uploader", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    signIn(world.admin);
    await expect(removeDocument(world.ours.id, doc.id)).rejects.toThrow(
      /uploaded it/,
    );
  });

  it("takes the file out of the list and off the disk", async () => {
    await uploadDocument(world.ours.id, form("shared"));
    const [doc] = await listDocuments(world.ours.id, world.member);

    await removeDocument(world.ours.id, doc.id);

    expect(await listDocuments(world.ours.id, world.member)).toEqual([]);
    expect(await readdir(process.env.WAYPOINT_FILES_DIR!)).toEqual([]);
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
