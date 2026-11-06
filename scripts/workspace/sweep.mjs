import { isAbsolute, relative, resolve } from "node:path";
import { git } from "../delivery/process.mjs";
import { landedState, pullRequest } from "../delivery/github.mjs";
import { isAncestor } from "../delivery/sync.mjs";
import { listWorktrees, removeWorktree, sweepVerdict, worktreesDir } from "./worktrees.mjs";

const inside = (dir, path) => {
  const rel = relative(dir, path);
  return Boolean(rel) && !rel.startsWith("..") && !isAbsolute(rel);
};

function facts(main, current, worktree) {
  const base = {
    isMain: resolve(main) === worktree.path,
    managed: inside(worktreesDir(main), worktree.path),
    isCurrent: Boolean(current) && resolve(current) === worktree.path,
    locked: worktree.locked,
  };
  if (base.isMain || !base.managed || base.isCurrent || base.locked || !worktree.branch) return base;
  const dirty = Boolean(git(worktree.path, "status", "--porcelain"));
  const pr = dirty ? null : pullRequest(main, worktree.branch, "merged");
  if (!pr) return { ...base, dirty };
  const target = pr.baseRefName;
  return {
    ...base, dirty, pr: pr.number, target,
    contained: isAncestor(worktree.path, "HEAD", `origin/${target}`),
    landed: target === "develop" ? landedState(main, pr.mergeCommit.oid).state : "passed",
  };
}

/** Removes every managed worktree whose pull request has landed. Reports the rest. */
export function sweep(main, current) {
  git(main, "fetch", "--quiet", "origin", "develop", "main");
  const report = [];
  for (const worktree of listWorktrees(main)) {
    const known = facts(main, current, worktree);
    if (known.isMain || !known.managed) continue;
    const verdict = sweepVerdict(known);
    if (verdict.remove) {
      try { removeWorktree(main, worktree.path, worktree.branch); }
      catch (error) { report.push({ path: worktree.path, kept: error.message }); continue; }
      report.push({ path: worktree.path, removed: verdict.reason });
    } else report.push({ path: worktree.path, kept: verdict.reason });
  }
  return report;
}
