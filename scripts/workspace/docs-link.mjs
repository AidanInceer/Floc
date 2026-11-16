import { existsSync, lstatSync, symlinkSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { command, git } from "../delivery/process.mjs";

export const DOCS_REPO = "AidanInceer/floc-docs";

function restoreAssets(docs) {
  if (!existsSync(join(docs, ".git"))) return [];
  const deleted = git(docs, "ls-files", "--deleted", "--", "assets", "brand").split("\n").filter(Boolean);
  if (deleted.length) git(docs, "checkout", "--", ...deleted);
  return deleted;
}

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

export function isOwnDocs(root) {
  const marker = join(root, "docs", ".git");
  return !isLink(join(root, "docs")) && existsSync(marker) && lstatSync(marker).isFile();
}

function addDocsWorktree(canonical, path, branch) {
  try { git(canonical, "fetch", "--quiet", "origin", "main"); } catch {}
  if (git(canonical, "branch", "--list", branch)) git(canonical, "worktree", "add", "--quiet", path, branch);
  else git(canonical, "worktree", "add", "--quiet", "-b", branch, path, "origin/main");
}

export function removeDocs(main, root) {
  const docs = join(root, "docs");
  if (isLink(docs)) return unlinkSync(docs);
  if (!isOwnDocs(root)) return;
  try { git(docs, "fetch", "--quiet", "origin", "main"); } catch {}
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
