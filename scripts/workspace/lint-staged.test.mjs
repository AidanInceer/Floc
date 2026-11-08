import { test } from "node:test";
import assert from "node:assert/strict";
import { byPackage, relatedTests } from "../../lint-staged.config.mjs";

test("staged files group by the package that owns them; files outside a package run no tests", () => {
  const groups = byPackage([
    "C:\\dev\\Floc\\floc\\apps\\web\\src\\a.tsx",
    "C:/dev/Floc/floc/packages/floc-core/src/b.ts",
    "C:/dev/Floc/floc/apps/web/src/c.ts",
    "C:/dev/Floc/floc/marketing/src/d.ts",
    "C:/dev/Floc/scripts/e.ts",
  ]);
  assert.deepEqual([...groups.keys()], ["floc/apps/web", "floc/packages/floc-core", "floc/marketing"]);
  assert.equal(groups.get("floc/apps/web").length, 2);
});

test("each package runs only the tests related to its staged files", () => {
  const [web] = relatedTests(["/r/floc/apps/web/src/a.tsx"]);
  assert.match(web, /^pnpm --dir floc\/apps\/web exec vitest related --run --passWithNoTests "\/r\/floc\/apps\/web\/src\/a\.tsx"$/);
  assert.deepEqual(relatedTests(["/r/scripts/x.ts"]), []);
});
