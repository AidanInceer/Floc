import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, openSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { git } from "./process.mjs";

export const watchDir = (root) => join(resolve(root, git(root, "rev-parse", "--git-common-dir")), "floc-watch");
export const taskName = (slug) => `Floc\\watch-${slug}`;

export function watcherArgs({ script, pr, branch, target, worktree, main }) {
  return [script, "--pr", String(pr), "--branch", branch, "--target", target, "--main", main, ...(worktree ? ["--worktree", worktree] : [])];
}

const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;

/**
 * Why a scheduled task on Windows: an agent app may kill every process its
 * session started when the session ends. Task Scheduler runs the watcher
 * outside the session, as you, so it keeps going whichever app started it.
 */
export function startWatcher(options) {
  const dir = watchDir(options.main);
  mkdirSync(dir, { recursive: true });
  const slug = options.branch.replaceAll("/", "-");
  const log = join(dir, `${slug}.log`);
  const args = watcherArgs({ ...options, script: join(options.scripts, "delivery", "watch.mjs") });
  if (process.platform !== "win32") {
    const child = spawn(process.execPath, args, { cwd: options.main, detached: true, stdio: ["ignore", openSync(log, "a"), openSync(log, "a")] });
    child.unref();
    return { log };
  }
  const cmd = join(dir, `${slug}.cmd`);
  writeFileSync(cmd, `@echo off\r\ncd /d ${quote(options.main)}\r\n${[process.execPath, ...args].map(quote).join(" ")} >> ${quote(log)} 2>&1\r\nschtasks /Delete /TN ${quote(taskName(slug))} /F >nul 2>&1\r\n`);
  const vbs = join(dir, `${slug}.vbs`);
  writeFileSync(vbs, `CreateObject("WScript.Shell").Run """${cmd}""", 0, False\r\n`);
  const create = spawnSync("schtasks", ["/Create", "/TN", taskName(slug), "/TR", `wscript.exe //B //Nologo "${vbs}"`, "/SC", "ONCE", "/ST", "00:00", "/SD", "01/01/2099", "/IT", "/F"], { encoding: "utf8", windowsHide: true });
  if (create.status !== 0) throw new Error(`Could not register the watcher task: ${create.stderr || create.stdout}`);
  const run = spawnSync("schtasks", ["/Run", "/TN", taskName(slug)], { encoding: "utf8", windowsHide: true });
  if (run.status !== 0) throw new Error(`Could not start the watcher task: ${run.stderr || run.stdout}`);
  return { log, task: taskName(slug) };
}
