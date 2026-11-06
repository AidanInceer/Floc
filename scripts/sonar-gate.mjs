import { command, git } from "./delivery/process.mjs";
import { repository } from "./delivery/github.mjs";
import { requiredStatus, sonarStatus } from "./delivery/status.mjs";

const args = process.argv.slice(2);
const value = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
try {
  const pr = value("--pr");
  const branch = pr ? null : args.find((a) => !a.startsWith("--") && a !== value("--sha")) ?? "main";
  const sha = value("--sha") ?? git(process.cwd(), "rev-parse", "origin/main");
  const query = new URLSearchParams({ projectKey: "AidanInceer_Floc", ...(pr ? { pullRequest: pr } : { branch }) });
  const get = async (path) => {
    const res = await fetch("https://sonarcloud.io/api/" + path, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error("Sonar analysis is unavailable (" + res.status + ").");
    return res.json();
  };
  const { projectStatus } = await get("qualitygates/project_status?" + query);
  let state;
  if (pr) {
    const view = JSON.parse(command("gh", ["pr", "view", pr, "--repo", repository, "--json", "headRefOid,statusCheckRollup"]));
    state = view.headRefOid === sha ? requiredStatus(view.statusCheckRollup, ["SonarQube analysis"]).state : "pending";
    if (state === "passed" && projectStatus.status !== "OK") state = "failed";
  } else {
    const analyses = await get("project_analyses/search?" + new URLSearchParams({ project: "AidanInceer_Floc", branch, ps: "1" }));
    state = sonarStatus({ revision: analyses.analyses?.[0]?.revision, status: projectStatus.status }, sha).state;
  }
  console.log(JSON.stringify({ state, sha, ...(pr ? { pr } : { branch }),
    conditions: projectStatus.conditions?.filter((c) => c.status === "ERROR") ?? [] }));
  process.exitCode = state === "passed" ? 0 : state === "pending" ? 2 : 1;
} catch (error) { console.error(error.message); process.exitCode = 2; }
