import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { command, git } from "../delivery/process.mjs";

export function installHooks(root) {
  const hooks = join(root, ".floc/hooks");
  mkdirSync(hooks, { recursive: true });
  git(root, "config", "extensions.worktreeConfig", "true");
  git(root, "config", "--worktree", "core.hooksPath", hooks.replaceAll("\\", "/"));
  for (const name of ["pre-commit", "commit-msg"]) {
    const file = join(hooks, name);
    writeFileSync(file, `#!/bin/sh\nnode scripts/workspace/hooks.mjs ${name} "$@"\n`);
    chmodSync(file, 0o755);
  }
}

if (process.argv[1]?.endsWith("hooks.mjs")) {
  const root = git(process.cwd(), "rev-parse", "--show-toplevel");
  const action = process.argv[2];
  if (action === "install") installHooks(root);
  else if (action === "pre-commit") {
    command(process.execPath, ["scripts/sync-floc-plugin.mjs", "--check"], { cwd: root });
    command("pnpm", ["exec", "lint-staged"], { cwd: root, stdio: "inherit" });
  } else if (action === "commit-msg") command(process.execPath, ["scripts/check-commit-msg.mjs", process.argv[3]], { cwd: root, stdio: "inherit" });
  else throw new Error("Expected install, pre-commit or commit-msg.");
}
