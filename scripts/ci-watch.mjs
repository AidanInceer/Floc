#!/usr/bin/env node
// node scripts/ci-watch.mjs <sha> [--max-minutes 9]
// Exit 0 green · 1 failed (log printed) · 2 still running, run again. The
// deadline stays under the 10-minute ceiling on one agent tool call.
import { spawnSync } from "node:child_process";

const REPO = "AidanInceer/Floc";
const POLL_MS = 15_000;
const APPEAR_MS = 3 * 60_000;

function gh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8" });
  if (result.error) throw new Error(`could not run gh: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`gh ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

function runsFor(sha) {
  return JSON.parse(
    gh(["run", "list", "--repo", REPO, "--commit", sha, "--limit", "20",
      "--json", "databaseId,name,event,status,conclusion,url"]),
  );
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

function report(runs) {
  for (const run of runs) {
    const state = run.status === "completed" ? run.conclusion : run.status;
    console.log(`  ${state.padEnd(12)} ${run.name} (${run.event})  ${run.url}`);
  }
}

function printFailedLogs(runs) {
  for (const run of runs.filter((r) => r.conclusion === "failure")) {
    console.log(`\n-- ${run.name}: failed steps\n`);
    const log = gh(["run", "view", String(run.databaseId), "--repo", REPO, "--log-failed"]);
    console.log(log.split("\n").slice(-80).join("\n"));
  }
}

async function main() {
  const sha = process.argv[2];
  if (!sha) {
    console.error("usage: ci-watch.mjs <sha> [--max-minutes 9]");
    process.exit(1);
  }
  const flag = process.argv.indexOf("--max-minutes");
  const deadline = Date.now() + Number(flag > 0 ? process.argv[flag + 1] : 9) * 60_000;
  const started = Date.now();

  let runs = runsFor(sha);
  while (runs.length === 0 && Date.now() - started < APPEAR_MS) {
    await wait(POLL_MS);
    runs = runsFor(sha);
  }
  if (runs.length === 0) {
    console.log(`No workflow runs for ${sha} after ${APPEAR_MS / 60_000} minutes — was it pushed?`);
    process.exit(1);
  }

  while (runs.some((r) => r.status !== "completed") && Date.now() < deadline) {
    await wait(POLL_MS);
    runs = runsFor(sha);
  }

  report(runs);
  if (runs.some((r) => r.conclusion === "failure")) {
    printFailedLogs(runs);
    process.exit(1);
  }
  if (runs.some((r) => r.status !== "completed")) process.exit(2);
  console.log("\nAll runs green.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
