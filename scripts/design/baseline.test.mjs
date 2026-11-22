import assert from "node:assert/strict";
import { test } from "node:test";

import { grown, newRules, shrunk } from "./baseline.mjs";

test("writing the baseline keeps an old finding only down to today's count", () => {
  const baseline = { "radius a.tsx": 3, "shadow b.css": 2 };
  assert.deepEqual(shrunk(baseline, { "radius a.tsx": 1, "shadow b.css": 5 }), { "radius a.tsx": 1, "shadow b.css": 2 });
});

test("writing the baseline drops a finding that is gone", () => {
  assert.deepEqual(shrunk({ "radius a.tsx": 2 }, {}), {});
});

test("writing the baseline never adds a finding in a file it did not list", () => {
  assert.deepEqual(shrunk({ "radius a.tsx": 1 }, { "radius a.tsx": 1, "radius new.tsx": 4 }), { "radius a.tsx": 1 });
});

test("writing the baseline never adds an old rule's finding in a file it already lists", () => {
  assert.deepEqual(shrunk({ "radius a.tsx": 1 }, { "radius a.tsx": 1, "shadow a.tsx": 2 }), { "radius a.tsx": 1 });
});

test("a rule new since the base seeds its findings once", () => {
  const seeded = shrunk({ "radius a.tsx": 1 }, { "radius a.tsx": 1, "icon-box b.tsx": 2 }, new Set(["icon-box"]));
  assert.deepEqual(seeded, { "icon-box b.tsx": 2, "radius a.tsx": 1 });
});

test("with no baseline, writing it keeps only a new rule's findings", () => {
  assert.deepEqual(shrunk(null, { "radius a.tsx": 1 }), {});
});

test("the rules new since the base are the report ids the base did not have", () => {
  const before = 'report("radius", "x"); report("shadow", "y");';
  const after = 'report("radius", "x"); report("shadow", "y"); report("icon-box", "z");';
  assert.deepEqual([...newRules(before, after)], ["icon-box"]);
});

test("with no base rules to compare, no rule counts as new", () => {
  assert.deepEqual([...newRules(null, 'report("radius", "x");')], []);
});

test("a baseline that only shrank against the base has not grown", () => {
  assert.deepEqual(grown({ "radius a.tsx": 3, "shadow b.css": 1 }, { "radius a.tsx": 2 }), []);
});

test("a raised count or a new entry against the base is growth", () => {
  assert.deepEqual(grown({ "radius a.tsx": 1 }, { "radius a.tsx": 2, "shadow new.tsx": 1 }), ["radius a.tsx", "shadow new.tsx"]);
});

test("entries for a rule new since the base are not growth", () => {
  assert.deepEqual(grown({ "radius a.tsx": 1 }, { "radius a.tsx": 1, "icon-box b.tsx": 3 }, new Set(["icon-box"])), []);
});
