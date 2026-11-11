import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { git } from "./process.mjs";

export const docsPaths = (pages) => [...new Set(pages.map((page) => page.replaceAll("\\", "/").replace(/^\.?[/]?docs[/]/, "")))];

export function withClaim(claims, branch, pages) {
  const next = { ...claims };
  for (const page of pages) next[page] = [...new Set([...(next[page] ?? []), branch])];
  return next;
}

export function othersOn(claims, branch, pages, alive = () => true) {
  const shared = {};
  for (const page of pages) {
    const others = (claims[page] ?? []).filter((other) => other !== branch && alive(other));
    if (others.length) shared[page] = others;
  }
  return shared;
}

export const withoutPages = (claims, pages) => Object.fromEntries(Object.entries(claims).filter(([page]) => !pages.includes(page)));

function docsClone(main) {
  const docs = join(main, "docs");
  if (!existsSync(join(docs, ".git"))) throw new Error(`No docs clone at ${docs}. Run pnpm workspace:prepare in the main checkout.`);
  return docs;
}

// Why: every worktree's docs/ is this one clone, so its .git is the one place all sessions can read.
const claimsFile = (docs) => join(docs, ".git", "floc-doc-claims.json");

function readClaims(docs) {
  try { return JSON.parse(readFileSync(claimsFile(docs), "utf8")); }
  catch { return {}; }
}

const branchAlive = (main) => (branch) => Boolean(git(main, "branch", "--list", branch));

/**
 * Records that this branch edited these pages, and names any other live branch
 * that edited them too: Git commits a whole page, so the first to push carries both.
 */
export function claimDocs(main, branch, pages) {
  const docs = docsClone(main);
  const paths = docsPaths(pages);
  const claims = withClaim(readClaims(docs), branch, paths);
  writeFileSync(claimsFile(docs), JSON.stringify(claims, null, 2));
  return { claimed: paths, shared: othersOn(claims, branch, paths, branchAlive(main)) };
}

export const sharedDocs = (main, branch, pages) => othersOn(readClaims(docsClone(main)), branch, docsPaths(pages), branchAlive(main));

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function retry(action) {
  try { return action(); }
  catch {
    // Why: sessions share one docs clone, so a second commit can meet the first one's index lock.
    pause(2000);
    return action();
  }
}

/**
 * Commits only the pages this task changed, so two sessions never commit each
 * other's half-done edits to other pages from the shared clone.
 */
export function commitDocs(main, pages, subject) {
  const docs = docsClone(main);
  const paths = docsPaths(pages);
  retry(() => git(docs, "add", "-A", "--", ...paths));
  if (!git(docs, "diff", "--cached", "--name-only", "--", ...paths)) return [];
  retry(() => git(docs, "commit", "-m", subject, "--", ...paths));
  writeFileSync(claimsFile(docs), JSON.stringify(withoutPages(readClaims(docs), paths), null, 2));
  try { git(docs, "push", "--quiet", "origin", "HEAD"); }
  catch {
    git(docs, "pull", "--quiet", "--rebase", "--autostash", "origin", "main");
    git(docs, "push", "--quiet", "origin", "HEAD");
  }
  return paths;
}
