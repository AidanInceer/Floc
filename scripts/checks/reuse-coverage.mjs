import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** The merged PR into main that produced this commit. */
export const pickPull = (pulls) => pulls.find((pr) => pr.merged_at && pr.base?.ref === "main");

/** A passed CI run of the PR's head commit. */
export const pickRun = (runs) => runs.find((run) => run.conclusion === "success" && run.event === "pull_request");

export const pickArtifact = (artifacts) => artifacts.find((a) => a.name.startsWith("coverage-") && !a.expired);

const api = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));

// Why: the release PR must be up to date with main, so its head tree equals the merge commit's tree; its passed
// Release checks already hold the coverage Sonar needs, and the tests need not run again (#no-ticket loop 5).
function find(repo, sha) {
  const pull = pickPull(api(`repos/${repo}/commits/${sha}/pulls`));
  if (!pull) return null;
  const tree = (ref) => api(`repos/${repo}/commits/${ref}`).commit.tree.sha;
  if (tree(sha) !== tree(pull.head.sha)) return null;
  const run = pickRun(api(`repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${pull.head.sha}&event=pull_request&status=success`).workflow_runs);
  if (!run) return null;
  const artifact = pickArtifact(api(`repos/${repo}/actions/runs/${run.id}/artifacts`).artifacts);
  return artifact ? { runId: run.id, name: artifact.name } : null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let found = null;
  try { found = find(process.env.GITHUB_REPOSITORY, process.env.GITHUB_SHA); } catch (error) { console.log(`No reusable coverage: ${error.message}`); }
  const lines = found ? [`reuse=true`, `run-id=${found.runId}`, `name=${found.name}`] : ["reuse=false"];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines.join("\n") + "\n");
}
