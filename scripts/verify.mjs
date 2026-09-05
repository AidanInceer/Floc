#!/usr/bin/env node
/**
 * Picks the bash that `verify.sh` must run under.
 *
 * On Windows `bash` resolves to WSL, which is a different OS to the one that
 * installed `node_modules` — every native binary there is `win32-x64`, so
 * rollup, lightningcss and esbuild all fail to load and verify reports five
 * failures that say nothing about the code. Git Bash shares the Windows
 * filesystem and PATH, so it sees the same Node and the same binaries.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "verify.sh");

function windowsBash() {
  const candidates = [
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "bin", "bash.exe"),
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Git", "bin", "bash.exe"),
    join(process.env.LOCALAPPDATA ?? "", "Programs", "Git", "bin", "bash.exe"),
  ];
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

let bash = "bash";
if (process.platform === "win32") {
  bash = windowsBash();
  if (!bash) {
    console.error(
      "verify needs Git Bash on Windows — plain `bash` is WSL, which cannot load\n" +
        "this repo's Windows binaries. Install it: winget install Git.Git",
    );
    process.exit(1);
  }
}

const run = spawnSync(bash, [script, ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: "inherit",
});

process.exit(run.status ?? 1);
