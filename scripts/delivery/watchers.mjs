import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { watchDir } from "./schedule.mjs";

const ENDED = new Set(["done", "needs you", "stopped"]);

export const isRunning = (job) => !ENDED.has(job.state);

/** The folder a watcher's script lives in, read from its .cmd file. */
export function runsFrom(cmd) {
  const match = cmd.match(/"([^"]*?)[\\/]scripts[\\/]delivery[\\/]watch\.mjs"/);
  return match ? resolve(match[1]) : null;
}

export function readWatchers(main) {
  const dir = watchDir(main);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith(".json")).flatMap((file) => {
    try {
      const job = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const cmd = join(dir, file.replace(/\.json$/, ".cmd"));
      return [{ ...job, runsFrom: existsSync(cmd) ? runsFrom(readFileSync(cmd, "utf8")) : null }];
    } catch { return []; }
  });
}

/** Worktrees a running watcher still needs: the one it lands and the one its script runs from. */
export function watchedPaths(watchers) {
  return new Set(watchers.filter(isRunning).flatMap((job) => [job.worktree, job.runsFrom])
    .filter(Boolean).map((path) => resolve(path).toLowerCase()));
}
