import assert from "node:assert/strict";
import { test } from "node:test";

import { staleSnapshots } from "./prune-snapshots.mjs";

void test("every snapshot but the newest is stale", () => {
  assert.deepEqual(
    staleSnapshots(["0067_snapshot.json", "0069_snapshot.json", "0068_snapshot.json", "_journal.json"]),
    ["0067_snapshot.json", "0068_snapshot.json"],
  );
});

void test("a single snapshot is kept", () => {
  assert.deepEqual(staleSnapshots(["0068_snapshot.json", "_journal.json"]), []);
});

void test("the journal and any other file are never stale", () => {
  assert.deepEqual(staleSnapshots(["_journal.json", "notes.txt"]), []);
});
