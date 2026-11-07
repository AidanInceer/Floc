import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Claude Code PreToolUse hook. The main checkout only shapes work; a tracked
 * file edited there strands the edit, blocks the next pull and leaks into
 * every session that starts there.
 */
export function guardVerdict({ flocCommon, fileCommon, fileGitDir, ignored }) {
  if (!fileCommon || resolve(fileCommon).toLowerCase() !== resolve(flocCommon).toLowerCase()) return { allow: true };
  if (resolve(fileGitDir).toLowerCase() !== resolve(fileCommon).toLowerCase()) return { allow: true };
  if (ignored) return { allow: true };
  return { allow: false };
}

function gitIn(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

function nearestDir(file) {
  let dir = dirname(file);
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
  return dir;
}

function check(file) {
  const here = dirname(fileURLToPath(import.meta.url));
  const flocCommon = resolve(here, gitIn(here, "rev-parse", "--git-common-dir") ?? ".");
  const dir = nearestDir(resolve(file));
  const facts = gitIn(dir, "rev-parse", "--git-dir", "--git-common-dir", "--show-toplevel");
  if (!facts) return { allow: true };
  const [gitDir, common, top] = facts.split(/\r?\n/);
  const rel = relative(top, resolve(file)).replaceAll("\\", "/");
  const ignored = spawnSync("git", ["check-ignore", "-q", "--", rel], { cwd: top, windowsHide: true }).status === 0;
  return { ...guardVerdict({ flocCommon, fileCommon: resolve(dir, common), fileGitDir: resolve(dir, gitDir), ignored }), top, rel };
}

if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === resolve(fileURLToPath(import.meta.url)).toLowerCase()) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8") || "{}");
    const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
    const verdict = file ? check(file) : { allow: true };
    if (!verdict.allow) {
      process.stderr.write(`Blocked: ${verdict.rel} is a repo file in the main checkout (${verdict.top}). `
        + "The main checkout only shapes work (floc/wireframe, docs, mockups). Build in a task worktree: "
        + "pnpm workspace:new <name>, then work in that folder.\n");
      process.exitCode = 2;
    }
  } catch {
    process.exitCode = 0;
  }
}
