import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function git(root, args, options = {}) {
  // Why: a develop merge stages diffs over Node's 1 MB default, which failed with no stderr.
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(result.stderr?.trim() || "git failed");
  return result.stdout;
}

export function collectChanges(root, base = process.env.FLOC_CHECK_BASE ?? "origin/main") {
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

/** Lines added or changed in the index, from one diff — the hook lints what the commit will hold. */
export function collectStaged(root) {
  const diff = git(root, ["-c", "core.quotepath=false", "diff", "--cached", "--no-ext-diff", "--no-textconv", "--no-renames", "--diff-filter=ACM", "-U0"]);
  const changes = new Map();
  let lines = null;
  for (const line of diff.split("\n")) {
    const file = /^\+\+\+ b\/(.+?)\r?$/.exec(line);
    if (file) {
      lines = new Set();
      changes.set(file[1], lines);
      continue;
    }
    const hunk = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!hunk || !lines) continue;
    const start = Number(hunk[1]);
    for (let i = 0; i < Number(hunk[2] ?? 1); i++) lines.add(start + i);
  }
  for (const [file, set] of changes) if (!set.size) changes.delete(file);
  return changes;
}
