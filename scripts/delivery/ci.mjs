/** One decision from one look at an open or closed PR. Pure, so every branch of it is tested. */
export function prStep({ pr, checks }) {
  if (pr.state === "MERGED") return { do: "report", state: "merged" };
  if (pr.state === "CLOSED") return { do: "report", state: "closed" };
  if (checks.state === "failed") return { do: "report", state: "failed", failed: checks.failed };
  if (pr.mergeable === "CONFLICTING") return { do: "report", state: "conflict" };
  if (checks.state === "passed" && !pr.autoMergeRequest && pr.mergeable === "MERGEABLE") return { do: "merge" };
  return { do: "wait" };
}
