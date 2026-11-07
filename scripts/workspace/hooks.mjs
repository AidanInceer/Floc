import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { command, git } from "../delivery/process.mjs";
import { folderFor, isScratch } from "./worktrees.mjs";

export function installHooks(root) {
  const hooks = join(root, ".floc/hooks");
  mkdirSync(hooks, { recursive: true });
  git(root, "config", "extensions.worktreeConfig", "true");
  git(root, "config", "--worktree", "core.hooksPath", hooks.replaceAll("\\", "/"));
  for (const name of ["pre-commit", "commit-msg", "post-checkout"]) {
    const file = join(hooks, name);
    writeFileSync(file, `#!/bin/sh\nnode scripts/workspace/hooks.mjs ${name} "$@"\n`);
    chmodSync(file, 0o755);
  }
}

/** Why: one session moved one worktree through three branches and three PRs, and nobody could follow it. */
export function switchWarning({ root, branch }) {
  if (basename(dirname(resolve(root))) !== "worktrees" || isScratch(branch) || branch.startsWith("release/")) return null;
  const folder = basename(resolve(root));
  if (folderFor(branch) === folder) return null;
  return `Worktree ${folder} now holds ${branch}. One task, one worktree, one session: finish this task, then pnpm workspace:new <name> and work there.`;
}

if (process.argv[1]?.endsWith("hooks.mjs")) {
  const root = git(process.cwd(), "rev-parse", "--show-toplevel");
  const action = process.argv[2];
  if (action === "install") installHooks(root);
  else if (action === "pre-commit") {
    command(process.execPath, ["scripts/sync-floc-plugin.mjs", "--check"], { cwd: root });
    command("pnpm", ["exec", "lint-staged"], { cwd: root, stdio: "inherit" });
  } else if (action === "post-checkout") {
    const warning = process.argv[5] === "1" ? switchWarning({ root, branch: git(root, "branch", "--show-current") }) : null;
    if (warning) console.error(warning);
  } else if (action === "commit-msg") command(process.execPath, ["scripts/check-commit-msg.mjs", process.argv[3]], { cwd: root, stdio: "inherit" });
  else throw new Error("Expected install, pre-commit, post-checkout or commit-msg.");
}
