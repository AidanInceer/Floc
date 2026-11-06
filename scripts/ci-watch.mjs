import { command } from "./delivery/process.mjs";
import { repository } from "./delivery/github.mjs";

// Why: cancelled and timed-out runs are not green; only success, skipped and neutral are.
const GREEN = new Set(["success", "skipped", "neutral"]);

try {
  const sha = process.argv[2];
  if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("Usage: node scripts/ci-watch.mjs <full commit sha>");
  const runs = JSON.parse(command("gh", ["api", `repos/${repository}/commits/${sha}/check-runs?per_page=100`])).check_runs;
  const pending = runs.filter((r) => r.status !== "completed").map((r) => r.name);
  const failed = runs.filter((r) => r.status === "completed" && !GREEN.has(r.conclusion)).map((r) => `${r.name} (${r.conclusion})`);
  const state = failed.length ? "failed" : pending.length || !runs.length ? "pending" : "passed";
  console.log(JSON.stringify({ sha, state, failed, pending }));
  process.exitCode = state === "passed" ? 0 : state === "pending" ? 2 : 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
