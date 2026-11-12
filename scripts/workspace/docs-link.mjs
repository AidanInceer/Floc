import { existsSync, lstatSync, symlinkSync, unlinkSync } from "node:fs";
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

/**
 * Why: a task gets its own floc-docs worktree on `docs/<branch>`, cut from main, so its checks never
 * see another session's unpushed pages; finish merges it into main. Without a branch it links the shared clone.
 */
export function ensureDocs(root, main, { primary, clone = true, branch } = {}) {
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
  if (stat?.isSymbolicLink()) return { state: "linked" };
  if (stat) return isOwnDocs(root) ? { state: "own" } : { state: "local folder", next: "This checkout has its own docs folder; move it aside to link the shared one." };
  if (branch && existsSync(join(canonical, ".git"))) {
    addDocsWorktree(canonical, link, `docs/${branch}`);
    return { state: "own" };
  }
  symlinkSync(canonical, link, "junction");
  return { state: "linked" };
}

/** A floc-docs worktree has a .git file; the shared clone, or a link to it, has a .git folder. */
export function isOwnDocs(root) {
  const marker = join(root, "docs", ".git");
  return !isLink(join(root, "docs")) && existsSync(marker) && lstatSync(marker).isFile();
}

function addDocsWorktree(canonical, path, branch) {
  try { git(canonical, "fetch", "--quiet", "origin", "main"); } catch { /* offline: cut from the last fetched main */ }
  if (git(canonical, "branch", "--list", branch)) git(canonical, "worktree", "add", "--quiet", path, branch);
  else git(canonical, "worktree", "add", "--quiet", "-b", branch, path, "origin/main");
}

/** Removes a task's docs: a link at once, its own worktree only when every page is on floc-docs main. */
export function removeDocs(main, root) {
  const docs = join(root, "docs");
  if (isLink(docs)) return unlinkSync(docs);
  if (!isOwnDocs(root)) return;
  try { git(docs, "fetch", "--quiet", "origin", "main"); } catch { /* checked against the last fetched main */ }
  let landed = !git(docs, "status", "--porcelain");
  try { git(docs, "merge-base", "--is-ancestor", "HEAD", "origin/main"); } catch { landed = false; }
  if (!landed) throw new Error(`${docs} has pages not on floc-docs main. Run pnpm delivery finish first.`);
  const branch = git(docs, "branch", "--show-current");
  git(join(main, "docs"), "worktree", "remove", docs);
  if (branch) git(join(main, "docs"), "branch", "-D", branch);
}

function isLink(path) {
  try { return lstatSync(path).isSymbolicLink(); } catch { return false; }
}
