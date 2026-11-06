const done = (check) => ["completed", "COMPLETED"].includes(check.status) || Boolean(check.conclusion && !check.status);
const passedCheck = (check) => ["success", "SUCCESS"].includes(check.conclusion ?? check.state);

/** Cancelled, skipped, neutral and missing required checks never count as passed. */
export function requiredStatus(checks, required) {
  const pending = [], failed = [];
  for (const name of required) {
    const runs = checks.filter((c) => (c.name ?? c.context) === name);
    const latest = runs.at(-1);
    if (!latest || !done(latest)) pending.push(name);
    else if (!passedCheck(latest)) (["cancelled", "CANCELLED"].includes(latest.conclusion) ? pending : failed).push(name);
  }
  return { state: failed.length ? "failed" : pending.length ? "pending" : "passed", failed, pending };
}

export function deployedStatus({ healthSha, homeOk, github }, sha) {
  if (["failure", "error"].includes(github)) return { state: "failed", reason: "Railway reported a failed deployment." };
  if (healthSha === sha && homeOk) return { state: "passed" };
  if (healthSha === sha) return { state: "failed", reason: "The new version answers /api/health but the homepage does not load." };
  return { state: "pending", reason: "Production is not serving this commit yet." };
}

export function sonarStatus(analysis, sha) {
  return { state: analysis.revision !== sha ? "pending" : analysis.status === "OK" ? "passed" : "failed" };
}
