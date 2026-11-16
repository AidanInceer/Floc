const brokenRun = (runs) => runs.find((r) => r.workflowName === "CI" && r.status === "completed" && !["success", "skipped", "neutral"].includes(r.conclusion));

export const HOLD = "hold";
export const isHeld = (pr) => (pr.labels ?? []).some((label) => label.name === HOLD);

export const mergeMode = ({ hold, pr }) => (hold || isHeld(pr) ? "hold" : "auto");

export function prStep({ pr, checks, runs = [] }) {
  if (pr.state === "MERGED") return { do: "report", state: "merged" };
  if (pr.state === "CLOSED") return { do: "report", state: "closed" };
  if (checks.state === "failed") return { do: "report", state: "failed", failed: checks.failed };
  if (checks.state === "pending" && brokenRun(runs)) return { do: "report", state: "broken", url: brokenRun(runs).url };
  if (pr.mergeable === "CONFLICTING") return { do: "report", state: "conflict" };
  if (checks.state === "passed" && isHeld(pr)) return { do: "report", state: "held" };
  if (checks.state === "passed" && !pr.autoMergeRequest && pr.mergeable === "MERGEABLE") return { do: "merge" };
  return { do: "wait" };
}
