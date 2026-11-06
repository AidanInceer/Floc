import { existsSync } from "node:fs";
import { join } from "node:path";
import { git } from "./process.mjs";

export const docsPaths = (pages) => [...new Set(pages.map((page) => page.replaceAll("\\", "/").replace(/^\.?[/]?docs[/]/, "")))];

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
 * other's half-done edits from the shared clone.
 */
export function commitDocs(main, pages, subject) {
  const docs = join(main, "docs");
  if (!existsSync(join(docs, ".git"))) throw new Error(`No docs clone at ${docs}. Run pnpm workspace:prepare in the main checkout.`);
  const paths = docsPaths(pages);
  retry(() => git(docs, "add", "-A", "--", ...paths));
  if (!git(docs, "diff", "--cached", "--name-only", "--", ...paths)) return [];
  retry(() => git(docs, "commit", "-m", subject, "--", ...paths));
  try { git(docs, "push", "--quiet", "origin", "HEAD"); }
  catch {
    git(docs, "pull", "--quiet", "--rebase", "--autostash", "origin", "main");
    git(docs, "push", "--quiet", "origin", "HEAD");
  }
  return paths;
}
