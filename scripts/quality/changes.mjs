import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function git(root, args, options = {}) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", ...options });
  if (result.status !== 0) throw new Error(result.stderr?.trim() || "git failed");
  return result.stdout;
}

const codeOf = (line) => line.replace(/\r$/, "").replace(/\s+\/\/.*$/, "").replace(/\s*\/\*.*?\*\/\s*$/, "").trimEnd();

function flush(hunk, lines) {
  if (!hunk) return;
  const removed = hunk.removed.map((line) => [line, codeOf(line)]);
  hunk.added.forEach((line, index) => {
    const code = codeOf(line);
    const onlyComment = removed.some(([old, oldCode]) => old !== line && oldCode === code);
    if (!onlyComment) lines.add(hunk.start + index);
  });
}

export function changedLines(diff) {
  const changes = new Map();
  let file = null;
  let hunk = null;
  let inHeader = false;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      flush(hunk, changes.get(file));
      hunk = null;
      inHeader = true;
      continue;
    }
    const target = inHeader && /^\+\+\+ b\/(.+?)\r?$/.exec(line);
    if (target) {
      file = target[1];
      changes.set(file, new Set());
      continue;
    }
    const header = /^@@ -\S+ \+(\d+)(?:,\d+)? @@/.exec(line);
    if (header) {
      flush(hunk, changes.get(file));
      inHeader = false;
      hunk = { start: Number(header[1]), removed: [], added: [] };
    } else if (hunk && line.startsWith("-")) hunk.removed.push(line.slice(1));
    else if (hunk && line.startsWith("+")) hunk.added.push(line.slice(1));
  }
  flush(hunk, changes.get(file));
  for (const [name, set] of changes) if (!set.size) changes.delete(name);
  return changes;
}

export function collectChanges(root, base = process.env.FLOC_CHECK_BASE ?? "origin/main") {
  const sha = git(root, ["rev-parse", "--verify", base + "^{commit}"]).trim();
  const diff = git(root, ["-c", "core.quotepath=false", "diff", "--no-ext-diff", "--no-textconv", "--no-renames", "--diff-filter=ACM", "-U0", sha, "--"], { maxBuffer: 1 << 28 });
  const changes = new Map([...changedLines(diff)].filter(([file]) => existsSync(join(root, file))));
  const untracked = git(root, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
  for (const file of untracked) {
    if (!existsSync(join(root, file))) continue;
    const lines = readFileSync(join(root, file), "utf8").split(/\r?\n/);
    changes.set(file, new Set(lines.map((_, index) => index + 1)));
  }
  return changes;
}

export function collectStaged(root) {
  return changedLines(git(root, ["-c", "core.quotepath=false", "diff", "--cached", "--no-ext-diff", "--no-textconv", "--no-renames", "--diff-filter=ACM", "-U0"], { maxBuffer: 1 << 28 }));
}
