import assert from "node:assert/strict";
import { test } from "node:test";
import { missingPaths } from "./check-files-map.mjs";

const exists = (known) => (path) => known.includes(path);

test("names a path the map lists that is not on disk", () => {
  const map = "| Money | `floc/apps/web/src/components/money/` | `floc/apps/web/src/server/cash/` |";
  assert.deepEqual(missingPaths(map, exists(["floc/apps/web/src/components/money/"])), [
    "floc/apps/web/src/server/cash/",
  ]);
});

test("ignores code spans that are not repo paths", () => {
  const map = "Run `pnpm fitness`, read `@floc/core` and `/_house/`, on `:4100`.";
  assert.deepEqual(missingPaths(map, exists([])), []);
});

test("skips gitignored folders a fresh checkout does not have", () => {
  assert.deepEqual(missingPaths("`floc/wireframe/` pages", exists([])), []);
});
