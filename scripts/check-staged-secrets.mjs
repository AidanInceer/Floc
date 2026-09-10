/**
 * gitleaks over the staged changes, before the commit exists.
 *
 * CI scans the full history (a secret removed in a later commit is still
 * leaked) and `pnpm verify` scans the working tree; both find a secret that is
 * already written down. This is the only one that finds it while it is still
 * free to undo. Silent when gitleaks is not installed — a hook that blocks
 * every commit on a missing optional tool is a hook people delete.
 */
import { spawnSync } from "node:child_process";

const probe = spawnSync("gitleaks", ["version"], { shell: true, stdio: "ignore" });
if (probe.status !== 0) process.exit(0);

const scan = spawnSync(
  "gitleaks",
  ["protect", "--staged", "--no-banner", "--redact"],
  { shell: true, stdio: "inherit" },
);
process.exit(scan.status ?? 0);
