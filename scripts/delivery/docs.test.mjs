import { test } from "node:test";
import assert from "node:assert/strict";
import { docsPaths, othersOn, withClaim, withoutPages } from "./docs.mjs";

test("a page path is stored once, relative to docs, whatever form it was given in", () => {
  assert.deepEqual(docsPaths(["docs/product/pro/index.html", ".\\docs\\product\\pro\\index.html", "index.html"]),
    ["product/pro/index.html", "index.html"]);
});

test("claiming a page twice from one branch records it once", () => {
  const once = withClaim({}, "feature/a", ["index.html"]);
  assert.deepEqual(withClaim(once, "feature/a", ["index.html"]), { "index.html": ["feature/a"] });
});

test("a page two branches edited names the other branch, never your own", () => {
  const claims = withClaim(withClaim({}, "feature/a", ["index.html", "a.html"]), "feature/b", ["index.html"]);
  assert.deepEqual(othersOn(claims, "feature/b", ["index.html", "a.html"]), { "index.html": ["feature/a"], "a.html": ["feature/a"] });
  assert.deepEqual(othersOn(claims, "feature/a", ["a.html"]), {});
});

test("a branch that no longer exists claims nothing", () => {
  const claims = withClaim({}, "feature/gone", ["index.html"]);
  assert.deepEqual(othersOn(claims, "feature/b", ["index.html"], (branch) => branch !== "feature/gone"), {});
});

test("a pushed page is free again; other pages keep their claims", () => {
  const claims = withClaim({}, "feature/a", ["index.html", "a.html"]);
  assert.deepEqual(withoutPages(claims, ["index.html"]), { "a.html": ["feature/a"] });
});
