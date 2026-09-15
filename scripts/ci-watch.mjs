#!/usr/bin/env node
// node scripts/ci-watch.mjs <sha> [--max-minutes 9]
// Exit 0 green · 1 failed (log printed) · 2 still running, run again. The
// deadline stays under the 10-minute ceiling on one agent tool call.
import { spawnSync } from "node:child_process";

const REPO = "AidanInceer/Floc";
const POLL_MS = 15_000;
const APPEAR_MS = 3 * 60_000;
const MAX_MINUTES = 9;
const SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i;
const RUN_ID_PATTERN = /^[1-9][0-9]{0,19}$/;
const NEWLINES = /[\r\n]/g;
const OTHER_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu;

function safeLogValue(value) {
  return String(value)
    .replace(NEWLINES, (character) => (character === "\r" ? "\\r" : "\\n"))
    .replace(OTHER_CONTROL_CHARS, (character) => {
      const code = character.codePointAt(0).toString(16).padStart(4, "0");
      return `\\u${code}`;
    });
}

function printLog(value) {
  console.log(safeLogValue(value));
}

function validateSha(value) {
  if (!SHA_PATTERN.test(value)) {
    throw new Error("commit SHA must contain exactly 40 or 64 hexadecimal characters");
  }
  return value;
}

function validateRunId(value) {
  const runId = String(value);
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error("GitHub workflow run ID was not numeric");
  }
  return runId;
}

function parseMaxMinutes(argv) {
  const flag = argv.indexOf("--max-minutes");
  if (flag === -1) return MAX_MINUTES;

  const value = argv[flag + 1];
  if (
    !/^\d+(?:\.\d+)?$/.test(value ?? "") ||
    Number(value) <= 0 ||
    Number(value) > MAX_MINUTES
  ) {
    throw new Error(`--max-minutes must be a number between 0 and ${MAX_MINUTES}`);
  }
  return Number(value);
}

function gh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8", shell: false });
  if (result.error) throw new Error(`could not run gh: ${safeLogValue(result.error.message)}`);
  if (result.status !== 0) {
    throw new Error(`gh command failed: ${safeLogValue(result.stderr?.trim() ?? "")}`);
  }
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
    printLog(`  ${String(state).padEnd(12)} ${run.name} (${run.event})  ${run.url}`);
  }
}

function printFailedLogs(runs) {
  for (const run of runs.filter((r) => r.conclusion === "failure")) {
    printLog(`-- ${run.name}: failed steps`);
    const log = gh([
      "run",
      "view",
      validateRunId(run.databaseId),
      "--repo",
      REPO,
      "--log-failed",
    ]);
    for (const line of log.split(/\r?\n/u).slice(-80)) printLog(line);
  }
}

async function main() {
  const suppliedSha = process.argv[2];
  if (!suppliedSha) {
    console.error("usage: ci-watch.mjs <sha> [--max-minutes 9]");
    process.exit(1);
  }
  const sha = validateSha(suppliedSha);
  const deadline = Date.now() + parseMaxMinutes(process.argv.slice(2)) * 60_000;
  const started = Date.now();

  let runs = runsFor(sha);
  while (runs.length === 0 && Date.now() - started < APPEAR_MS) {
    await wait(POLL_MS);
    runs = runsFor(sha);
  }
  if (runs.length === 0) {
    printLog(`No workflow runs for ${sha} after ${APPEAR_MS / 60_000} minutes — was it pushed?`);
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
  printLog("All runs green.");
}

main().catch((error) => {
  console.error(safeLogValue(error.message));
  process.exit(1);
});
