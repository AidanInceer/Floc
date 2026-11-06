import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";

export function command(command, args, options = {}) {
  let executable = command;
  let pnpmEntry;
  if (command === "pnpm") {
    const corepack = join(dirname(process.execPath), "node_modules/corepack/dist/pnpm.js");
    pnpmEntry = existsSync(corepack) ? corepack : process.env.npm_execpath?.includes("pnpm") ? process.env.npm_execpath : null;
    if (pnpmEntry) { executable = process.execPath; args = [pnpmEntry, ...args]; }
  }
  const supplied = options.env ?? process.env;
  const path = Object.entries(supplied).find(([key]) => key.toUpperCase() === "PATH")?.[1] ?? "";
  const env = Object.fromEntries(Object.entries(supplied).filter(([key]) => key.toUpperCase() !== "PATH"));
  env.PATH = dirname(process.execPath) + delimiter + path;
  if (pnpmEntry) {
    const bin = resolve(options.cwd ?? process.cwd(), ".floc/bin");
    mkdirSync(bin, { recursive: true });
    const shim = join(bin, process.platform === "win32" ? "pnpm.cmd" : "pnpm");
    const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
    writeFileSync(shim, process.platform === "win32" ? `@"${process.execPath}" "${pnpmEntry}" %*\r\n`
      : `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(pnpmEntry)} "$@"\n`);
    chmodSync(shim, 0o755);
    Object.assign(env, { FLOC_NODE: process.execPath, FLOC_PNPM_ENTRY: pnpmEntry, PATH: bin + delimiter + env.PATH });
  }
  const result = spawnSync(executable, args, { encoding: "utf8", windowsHide: true, ...options, env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${(result.stderr || result.stdout || "").slice(-6000)}`);
  return result.stdout?.trim() ?? "";
}

export const git = (root, ...args) => command("git", args, { cwd: root });
export const gitFile = (root, name) => resolve(root, git(root, "rev-parse", "--git-path", name));
