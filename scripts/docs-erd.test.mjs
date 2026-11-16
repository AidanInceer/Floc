import { test } from "node:test";
import assert from "node:assert/strict";
import { erdFailures } from "./docs-erd.mjs";

const SCHEMA = `
const audit = {
  createdAt: integer("created_at", { mode: "timestamp" }),
};
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
});
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
});
export const trip = sqliteTable(
  "trip",
  {
    id: integer("id").primaryKey(),
    createdBy: text("created_by").references(() => user.id),
    ...audit,
  },
  (t) => [index("trip_idx").on(t.createdBy)],
);
`;

const node = (name, columns) =>
  `<div class="sm-node er k-trip" data-node="${name}" data-what="x"><b>${name}</b><ul class="er-cols">${columns
    .map((c) => `<li data-col="${c}"><span>${c}</span></li>`)
    .join("")}</ul></div>`;

const page = (nodes, joins) =>
  `<figure class="sm sm-inline sm-erd" data-route="free"><div class="sm-flow">${nodes.join("")}</div>` +
  `<script type="application/json">${JSON.stringify(joins)}</script></figure>`;

const GOOD = page([node("USER", ["id"]), node("TRIP", ["id", "created_by", "created_at"])], [["USER", "TRIP", "stream"]]);

test("a diagram that matches the schema passes", () => {
  assert.deepEqual(erdFailures(SCHEMA, GOOD), []);
});

test("a page with no diagram fails", () => {
  assert.match(erdFailures(SCHEMA, "<p>Tables by feature</p>").join("\n"), /figure\.sm-erd\) is missing/);
});

test("a Mermaid block fails", () => {
  assert.match(erdFailures(SCHEMA, `${GOOD}<pre class="mermaid">erDiagram</pre>`).join("\n"), /mermaid/);
});

test("a schema table missing from the diagram fails", () => {
  const failures = erdFailures(SCHEMA, page([node("USER", ["id"])], []));
  assert.match(failures.join("\n"), /table "trip" is in schema\.ts but not in the ERD/);
});

test("a diagram table that left the schema fails", () => {
  const failures = erdFailures(SCHEMA, page([node("USER", ["id"]), node("TRIP", ["id"]), node("OLD", ["id"])], [["USER", "TRIP"]]));
  assert.match(failures.join("\n"), /shows table "old"/);
});

test("a diagram column that left the schema fails", () => {
  const failures = erdFailures(SCHEMA, page([node("USER", ["id"]), node("TRIP", ["id", "gone"])], [["USER", "TRIP"]]));
  assert.match(failures.join("\n"), /"trip\.gone"/);
});

test("a foreign key with no join line fails", () => {
  const failures = erdFailures(SCHEMA, page([node("USER", ["id"]), node("TRIP", ["id"])], []));
  assert.match(failures.join("\n"), /"trip" has a foreign key to "user"/);
});
