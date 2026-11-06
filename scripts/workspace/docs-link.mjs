import { existsSync, lstatSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { command, git } from "../delivery/process.mjs";

export const DOCS_REPO = "AidanInceer/floc-docs";

/**
 * Why: the Floc repo tracked docs/assets and docs/brand until the docs moved.
 * Pulling that change, or checking out an older Floc commit in a linked
 * worktree, deletes them from the floc-docs clone, so put them back.
 */
function restoreAssets(docs) {
  if (!existsSync(join(docs, ".git"))) return [];
  const deleted = git(docs, "ls-files", "--deleted", "--", "assets", "brand").split("\n").filter(Boolean);
  if (deleted.length) git(docs, "checkout", "--", ...deleted);
  return deleted;
}

/** The main checkout holds the floc-docs clone; every other worktree links to it. */
export function ensureDocs(root, main, { primary, clone = true } = {}) {
  const canonical = join(main, "docs");
  if (!existsSync(join(canonical, "index.html"))) {
    if (!primary || !clone) return { state: "missing", next: `gh repo clone ${DOCS_REPO} "${canonical}"` };
    try { command("gh", ["repo", "clone", DOCS_REPO, canonical]); }
    catch { return { state: "missing", next: `gh repo clone ${DOCS_REPO} "${canonical}"` }; }
  }
  const restored = restoreAssets(canonical);
  if (primary) return { state: "clone", restored };
  const link = join(root, "docs");
  const stat = existsSync(link) || isLink(link) ? lstatSync(link) : null;
  if (!stat) {
    symlinkSync(canonical, link, "junction");
    return { state: "linked" };
  }
  return stat.isSymbolicLink() ? { state: "linked" } : { state: "local folder", next: "This checkout has its own docs folder; move it aside to link the shared one." };
}

function isLink(path) {
  try { return lstatSync(path).isSymbolicLink(); } catch { return false; }
}
