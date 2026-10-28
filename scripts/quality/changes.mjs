import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function git(root, args, options = {}) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", ...options });
  if (result.status !== 0) throw new Error(result.stderr?.trim() || "git failed");
  return result.stdout;
}

export function collectChanges(root, base = "origin/main") {
  const sha = git(root, ["rev-parse", "--verify", base + "^{commit}"]).trim();
  const changes = new Map();
  const files = git(root, ["diff", "--no-ext-diff", "--no-renames", "--name-only", "--diff-filter=ACM", "-z", sha, "--"]).split("\0").filter(Boolean);
  for (const file of files) {
    if (!existsSync(join(root, file))) continue;
    const diff = git(root, ["diff", "--no-ext-diff", "--no-textconv", "--no-renames", "-U0", sha, "--", file]);
    const lines = new Set();
    for (const match of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Number(match[1]);
      const count = Number(match[2] ?? 1);
      for (let i = 0; i < count; i++) lines.add(start + i);
    }
    if (lines.size) changes.set(file, lines);
  }
  const untracked = git(root, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
  for (const file of untracked) {
    if (!existsSync(join(root, file))) continue;
    const lines = readFileSync(join(root, file), "utf8").split(/\r?\n/);
    changes.set(file, new Set(lines.map((_, index) => index + 1)));
  }
  return changes;
}
