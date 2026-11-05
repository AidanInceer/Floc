import assert from "node:assert/strict";
import { test } from "node:test";

import { findViolations } from "./rules.mjs";

const rules = (file, text) => findViolations(file, text).map((v) => v.rule);

test("a CSS radius must come from a radius token", () => {
  assert.deepEqual(rules("a.css", ".x { border-radius: 10px; }"), ["radius"]);
  assert.deepEqual(rules("a.css", ".x { border-radius: var(--radius-sm); }"), []);
  assert.deepEqual(rules("a.css", ".x { border-radius: 0 0 var(--radius-md) var(--radius-md); }"), []);
  assert.deepEqual(rules("a.css", ".x { border-radius: 50%; }"), []);
  assert.deepEqual(rules("a.css", ".x { border-top-left-radius: 4px; }"), ["radius"]);
});

test("a Tailwind radius is sm, md or full", () => {
  assert.deepEqual(rules("a.tsx", '<div className="rounded-md p-2" />'), []);
  assert.deepEqual(rules("a.tsx", '<div className="rounded-t-sm rounded-full" />'), []);
  assert.deepEqual(rules("a.tsx", '<div className="rounded-[10px]" />'), ["radius"]);
  assert.deepEqual(rules("a.tsx", '<div className="rounded-lg" />'), ["radius"]);
  assert.deepEqual(rules("a.tsx", '<div className="rounded p-2" />'), ["radius"]);
});

test("an inline radius uses the scale, not a number", () => {
  assert.deepEqual(rules("a.tsx", "style={{ borderRadius: 9 }}"), ["radius"]);
  assert.deepEqual(rules("a.tsx", "style={{ borderRadius: radius.sm }}"), []);
  assert.deepEqual(rules("a.tsx", "style={{ borderRadius: 0 }}"), []);
});

test("a shadow comes from a shadow token; a flat ring is not a shadow", () => {
  assert.deepEqual(rules("a.css", ".x { box-shadow: 0 8px 24px rgb(0 0 0 / 0.2); }"), ["shadow"]);
  assert.deepEqual(rules("a.css", ".x { box-shadow: var(--shadow-lift); }"), []);
  assert.deepEqual(rules("a.css", ".x { box-shadow: none; }"), []);
  assert.deepEqual(rules("a.css", ".x { box-shadow: inset 0 0 0 1px var(--pen); }"), []);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-lg" />'), ["shadow"]);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-[0_4px_12px_black]" />'), ["shadow"]);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-[0_0_0_1.5px_var(--pen)] shadow-raised" />'), []);
});

test("a shadow class must map to a house token", () => {
  assert.deepEqual(rules("a.tsx", '<i className="shadow-sm" />'), ["shadow"]);
  assert.deepEqual(rules("a.tsx", '<i className="lg:shadow-lift" />'), ["shadow"]);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-card hover:shadow-lifted" />'), []);
});

test("an inset or unblurred shadow draws a line, not depth", () => {
  assert.deepEqual(rules("a.css", ".x { box-shadow: inset 0 2px 0 var(--pen); }"), []);
  assert.deepEqual(rules("a.css", ".x { box-shadow: 0 1px 0 var(--rule); }"), []);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-[inset_-1px_0_0_var(--rule)] hover:shadow-none!" />'), []);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-[inset_0_0_0_1px_var(--rule),var(--shadow-sm)]" />'), []);
  assert.deepEqual(rules("a.tsx", '<i className="shadow-[var(--shadow)]" />'), []);
});

test("hover never fills grey", () => {
  assert.deepEqual(rules("a.tsx", '<b className="hover:bg-sheet-2" />'), ["hover-grey"]);
  assert.deepEqual(rules("a.tsx", '<b className="hover:bg-pen-soft" />'), []);
  assert.deepEqual(rules("a.css", ".b:hover { background: var(--sheet-3); }"), ["hover-grey"]);
});

test("money is never approximate", () => {
  assert.deepEqual(rules("a.tsx", "<span>≈ {amount}</span>"), ["approx-money"]);
  assert.deepEqual(rules("a.tsx", "<span>~£40</span>"), ["approx-money"]);
});

test("a field has no placeholder text", () => {
  assert.deepEqual(rules("a.tsx", '<input placeholder="Lisbon" />'), ["placeholder"]);
  assert.deepEqual(rules("a.tsx", "<TextInput placeholder={hint} />"), ["placeholder"]);
  assert.deepEqual(rules("a.tsx", '<input className="placeholder:text-ink-faint" />'), []);
});

test("the UI carries no emoji", () => {
  assert.deepEqual(rules("a.tsx", "<p>Packed ✅</p>"), ["emoji"]);
  assert.deepEqual(rules("a.tsx", "<p>Packed</p>"), []);
});

test("comment lines are not checked", () => {
  assert.deepEqual(rules("a.tsx", "// was rounded-[10px] before #300"), []);
  assert.deepEqual(rules("a.css", "/* border-radius: 4px was too round */"), []);
});
