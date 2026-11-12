import { command } from "./delivery/process.mjs";
import { gh, json, repository, requiredChecks, viewPull } from "./delivery/github.mjs";
import { requiredStatus } from "./delivery/status.mjs";
import { prStep } from "./delivery/ci.mjs";

// Why: cancelled and timed-out runs are not green; only success, skipped and neutral are.
const GREEN = new Set(["success", "skipped", "neutral"]);
const EVERY = 20_000;

const args = process.argv.slice(2);
const option = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);

function commit(sha) {
  const runs = JSON.parse(command("gh", ["api", `repos/${repository}/commits/${sha}/check-runs?per_page=100`])).check_runs;
  const pending = runs.filter((r) => r.status !== "completed").map((r) => r.name);
  const failed = runs.filter((r) => r.status === "completed" && !GREEN.has(r.conclusion)).map((r) => `${r.name} (${r.conclusion})`);
  const state = failed.length ? "failed" : pending.length || !runs.length ? "pending" : "passed";
  return { sha, state, failed, pending };
}

/** Why a time limit: one Bash call stops at 10 minutes, so the agent calls this again while it says pending. */
async function pull(number, seconds) {
  const until = Date.now() + seconds * 1000;
  let broken = 0;
  for (;;) {
    const pr = viewPull(process.cwd(), number);
    const checks = requiredStatus(pr.statusCheckRollup ?? [], requiredChecks[pr.baseRefName] ?? requiredChecks.develop);
    const runs = checks.state === "pending" && pr.state === "OPEN"
      ? json(process.cwd(), "run", "list", "--commit", pr.headRefOid, "--json", "workflowName,status,conclusion,url") : [];
    // Why: the check rollup can lag a finished run by a moment; a broken run counts only when two looks in a row agree.
    let step = prStep({ pr, checks, runs });
    broken = step.state === "broken" ? broken + 1 : 0;
    if (step.state === "broken" && broken < 2) step = { do: "wait" };
    if (step.do === "report") return { pr: pr.number, url: pr.url, ...step, sha: pr.mergeCommit?.oid ?? pr.headRefOid };
    if (step.do === "merge") gh(process.cwd(), "pr", "merge", String(number), "--merge", "--match-head-commit", pr.headRefOid);
    if (Date.now() + EVERY > until) return { pr: pr.number, url: pr.url, state: "pending", pending: checks.pending };
    await new Promise((done) => setTimeout(done, EVERY));
  }
}

try {
  const number = option("--pr");
  const sha = args.find((a) => /^[a-f0-9]{40}$/.test(a));
  if (!number && !sha) throw new Error("Usage: node scripts/ci-watch.mjs --pr <number> [--for <seconds>]   or   node scripts/ci-watch.mjs <full commit sha>");
  const result = number ? await pull(number, Number(option("--for", 540))) : commit(sha);
  console.log(JSON.stringify(result));
  process.exitCode = ["passed", "merged", "held"].includes(result.state) ? 0 : result.state === "pending" ? 2 : 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
