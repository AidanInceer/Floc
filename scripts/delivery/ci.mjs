/** One decision from one look at an open or closed PR. Pure, so every branch of it is tested. */
// Why: a CI run can end red before its jobs exist (PR #558); the required checks then stay pending for ever.
const brokenRun = (runs) => runs.find((r) => r.workflowName === "CI" && r.status === "completed" && !["success", "skipped", "neutral"].includes(r.conclusion));

export function prStep({ pr, checks, runs = [] }) {
  if (pr.state === "MERGED") return { do: "report", state: "merged" };
  if (pr.state === "CLOSED") return { do: "report", state: "closed" };
  if (checks.state === "failed") return { do: "report", state: "failed", failed: checks.failed };
  if (checks.state === "pending" && brokenRun(runs)) return { do: "report", state: "broken", url: brokenRun(runs).url };
  if (pr.mergeable === "CONFLICTING") return { do: "report", state: "conflict" };
  if (checks.state === "passed" && !pr.autoMergeRequest && pr.mergeable === "MERGEABLE") return { do: "merge" };
  return { do: "wait" };
}
