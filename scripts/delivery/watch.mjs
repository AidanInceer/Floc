import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { command, git } from "./process.mjs";
import { afterRelease, closedBy, gh, json, landedState, markLanded, repository, requiredChecks, viewPull } from "./github.mjs";
import { requiredStatus } from "./status.mjs";
import { deploymentStatus } from "./deployment.mjs";
import { isAncestor, mergeTarget } from "./sync.mjs";
import { notify } from "./notify.mjs";
import { watchDir } from "./schedule.mjs";
import { removeWorktree } from "../workspace/worktrees.mjs";

const MINUTE = 60_000;
const GIVE_UP_AFTER = 12 * 60 * MINUTE;
const DEPLOY_WITHIN = 45 * MINUTE;

/** One decision from one look at GitHub. Pure, so every branch of it is tested. */
export function nextStep({ target, pr, checks, landed, deploy, mergedFor = 0 }) {
  if (pr.state === "CLOSED") return { do: "stop", why: "closed without merging" };
  if (pr.state === "OPEN") {
    if (checks.state === "failed") return { do: "stop", why: `checks failed: ${checks.failed.join(", ")}` };
    if (pr.mergeable === "CONFLICTING") return { do: "sync" };
    if (checks.state === "passed" && !pr.autoMergeRequest && pr.mergeable === "MERGEABLE") return { do: "merge" };
    return { do: "wait" };
  }
  if (target === "develop") {
    if (landed.state === "failed") return { do: "stop", why: `develop CI is red after the merge: ${landed.failed.join(", ")}` };
    return landed.state === "passed" ? { do: "finish" } : { do: "wait" };
  }
  if (deploy.state === "failed") return { do: "stop", why: deploy.reason };
  if (deploy.state === "passed") return { do: "finish" };
  return mergedFor > DEPLOY_WITHIN ? { do: "stop", why: "production did not serve the merge within 45 minutes" } : { do: "wait" };
}

function parse(argv) {
  const value = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
  return { pr: value("--pr"), branch: value("--branch"), target: value("--target"), main: value("--main"), worktree: value("--worktree") };
}

function githubDeployment(main, sha) {
  const [deployment] = JSON.parse(command("gh", ["api", `repos/${repository}/deployments?sha=${sha}`], { cwd: main }));
  if (!deployment) return null;
  return JSON.parse(command("gh", ["api", `repos/${repository}/deployments/${deployment.id}/statuses`], { cwd: main }))[0]?.state ?? null;
}

const dirty = (worktree) => Boolean(git(worktree, "status", "--porcelain"));

function sync(job) {
  if (!job.worktree) return { stop: "conflicts with main and has no worktree to fix them in" };
  if (dirty(job.worktree)) return { stop: "conflicts with its target, and the worktree has unsaved edits" };
  const merged = mergeTarget(job.worktree, job.target);
  if (merged.state === "conflict") return { stop: `conflicts in ${merged.files.join(", ")}. Run /floc:push in that worktree to resolve them` };
  try { command(process.execPath, ["scripts/checks/run.mjs", "quick", "--base", `origin/${job.target}`], { cwd: job.worktree }); }
  catch { return { stop: `quick checks fail after merging ${job.target}; run /floc:push in that worktree` }; }
  git(job.worktree, "push", "origin", `HEAD:refs/heads/${job.branch}`);
  return {};
}

function releasedTickets(main, mergeSha) {
  git(main, "fetch", "--quiet", "origin", "main");
  return closedBy(git(main, "log", `${mergeSha}^1..${mergeSha}^2`, "--format=%B"));
}

function onMerged(job, pr) {
  const text = [json(job.main, "pr", "view", job.pr, "--json", "body").body, git(job.main, "log", "-1", "--format=%B", pr.headRefOid)].join("\n");
  const issues = closedBy(text);
  if (job.target === "develop") markLanded(job.main, issues, watchDir(job.main));
}

function finish(job, pr) {
  const lines = [];
  if (job.target === "main") {
    const open = afterRelease(job.main, releasedTickets(job.main, pr.mergeCommit.oid));
    if (open.length) lines.push(`still open: #${open.join(", #")}`);
    try { command(process.execPath, ["scripts/wireframe-tags.mjs", "--write"], { cwd: job.main }); } catch { lines.push("prototype tags not updated"); }
  }
  if (job.worktree) {
    git(job.main, "fetch", "--quiet", "origin", job.target);
    if (dirty(job.worktree)) lines.push("worktree kept: it has unsaved edits");
    else if (!isAncestor(job.worktree, "HEAD", `origin/${job.target}`)) lines.push("worktree kept: it has commits that did not land");
    else {
      try { removeWorktree(job.main, job.worktree, job.branch); lines.push("worktree removed"); }
      catch { lines.push("worktree folder is in use; the next sweep removes it"); }
    }
  }
  return lines;
}

async function look(job, mergedAt) {
  const pr = viewPull(job.main, job.pr);
  const checks = requiredStatus(pr.statusCheckRollup ?? [], requiredChecks[job.target]);
  const merged = pr.state === "MERGED";
  const landed = merged && job.target === "develop" ? landedState(job.main, pr.mergeCommit.oid) : { state: "pending", failed: [] };
  const deploy = merged && job.target === "main" ? await deploymentStatus(pr.mergeCommit.oid, { github: (sha) => githubDeployment(job.main, sha) }) : { state: "pending" };
  return { pr, step: nextStep({ target: job.target, pr, checks, landed, deploy, mergedFor: mergedAt ? Date.now() - mergedAt : 0 }) };
}

async function watch(job) {
  const dir = watchDir(job.main);
  mkdirSync(dir, { recursive: true });
  const stateFile = join(dir, `${job.branch.replaceAll("/", "-")}.json`);
  const save = (state, detail = "") => writeFileSync(stateFile, JSON.stringify({ ...job, state, detail, at: new Date().toISOString() }, null, 2));
  const label = `PR #${job.pr} (${job.branch})`;
  const started = Date.now();
  let mergedAt = 0;
  while (Date.now() - started < GIVE_UP_AFTER) {
    const { pr, step } = await look(job, mergedAt);
    if (pr.state === "MERGED" && !mergedAt) { mergedAt = Date.now(); onMerged(job, pr); }
    if (step.do === "stop") { save("needs you", step.why); notify(`Floc: ${label} needs you`, step.why); return; }
    if (step.do === "merge") gh(job.main, "pr", "merge", job.pr, "--merge", "--match-head-commit", pr.headRefOid);
    if (step.do === "sync") {
      const result = sync(job);
      if (result.stop) { save("needs you", result.stop); notify(`Floc: ${label} needs you`, result.stop); return; }
    }
    if (step.do === "finish") {
      const lines = finish(job, pr);
      const what = job.target === "main" ? `live on ${pr.mergeCommit.oid.slice(0, 7)}` : "landed on develop, CI green";
      save("done", [what, ...lines].join("; "));
      notify(`Floc: ${label} ${what}`, lines.join("; ") || "Nothing else to do.");
      return;
    }
    save(mergedAt ? "merged, waiting" : "waiting for checks");
    await new Promise((done) => setTimeout(done, MINUTE));
  }
  save("stopped", "gave up after 12 hours; the next sweep will finish it");
}

const direct = process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase();
if (direct) {
  watch(parse(process.argv.slice(2))).catch((error) => {
    notify("Floc: a watcher stopped", error.message.slice(0, 200));
    process.exitCode = 1;
  });
}
