import { test } from "node:test";
import assert from "node:assert/strict";
import { nextVersion, releaseBody } from "./release.mjs";

test("a release takes one version: minor for any feat, patch otherwise", () => {
  assert.equal(nextVersion("0.211.0", "0.211.0", ["#12: fix: a", "#no-ticket: feat: b"]), "0.212.0");
  assert.equal(nextVersion("0.211.3", "0.211.3", ["#12: fix: a", "#no-ticket: chore: b"]), "0.211.4");
  assert.equal(nextVersion("0.211.0", "0.211.0", ["0.212.0 #12: feat: legacy subject"]), "0.212.0");
});

test("a develop already bumped the old way keeps its version", () => {
  assert.equal(nextVersion("0.211.0", "0.214.0", ["#1: fix: a"]), "0.214.0");
  assert.equal(nextVersion("0.211.0", "0.210.0", ["#1: fix: a"]), "0.211.1");
});

test("the release PR names its tickets, other commits and migrations", () => {
  const body = releaseBody({ tickets: [{ number: "5", title: "Trip notes" }], others: ["#no-ticket: chore: tidy"], migrations: [] });
  assert.match(body, /- #5 Trip notes/);
  assert.match(body, /- #no-ticket: chore: tidy/);
  assert.match(body, /Schema migrations: none/);
});
