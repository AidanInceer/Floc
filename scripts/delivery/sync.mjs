import { command, git } from "./process.mjs";

// Why: only files a tool regenerates are safe to settle without reading both sides.
const REGENERATED = new Set(["pnpm-lock.yaml"]);

export const mechanical = (files) => files.length > 0 && files.every((file) => REGENERATED.has(file));

/** Merges origin/<target> into the task branch. A merge, never a rebase, so a published branch needs no force push. */
export function mergeTarget(root, target) {
  git(root, "fetch", "--quiet", "origin", target);
  const upstream = `origin/${target}`;
  if (isAncestor(root, upstream, "HEAD")) return { state: "current" };
  try {
    git(root, "merge", "--no-edit", upstream);
    return { state: "merged" };
  } catch {
    const files = git(root, "diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    if (!mechanical(files)) {
      git(root, "merge", "--abort");
      return { state: "conflict", files };
    }
    git(root, "checkout", "--theirs", "--", ...files);
    command("pnpm", ["install", "--lockfile-only"], { cwd: root });
    git(root, "add", "--", ...files);
    git(root, "commit", "--no-edit");
    return { state: "merged", regenerated: files };
  }
}

export function isAncestor(root, ancestor, ref) {
  try { git(root, "merge-base", "--is-ancestor", ancestor, ref); return true; } catch { return false; }
}
