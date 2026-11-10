import { join, resolve } from "node:path";
import { command, git } from "./process.mjs";
import { afterRelease, closedBy, json, markLanded, repository, viewPull } from "./github.mjs";
import { deploymentStatus } from "./deployment.mjs";
import { commitDocs, sharedDocs } from "./docs.mjs";
import { isAncestor } from "./sync.mjs";
import { listWorktrees, mainCheckout, removeWorktree } from "../workspace/worktrees.mjs";

const MINUTE = 60_000;
const DEPLOY_WITHIN = 45 * MINUTE;

/** Only a worktree whose every commit landed and that holds no unsaved edit is removed. */
export function worktreeVerdict({ dirty, contained }) {
  if (dirty) return { remove: false, reason: "worktree kept: it has unsaved edits" };
  if (!contained) return { remove: false, reason: "worktree kept: it has commits that did not land" };
  return { remove: true };
}

function closeWorktree(main, branch, target) {
  const worktree = listWorktrees(main).find((w) => w.branch === branch);
  if (!worktree) return "no worktree";
  git(main, "fetch", "--quiet", "origin", target);
  const verdict = worktreeVerdict({
    dirty: Boolean(git(worktree.path, "status", "--porcelain")),
    contained: isAncestor(worktree.path, "HEAD", `origin/${target}`),
  });
  if (!verdict.remove) return verdict.reason;
  try { removeWorktree(main, worktree.path, branch); return "worktree removed"; }
  catch { return "worktree folder is in use; the next sweep removes it"; }
}

function githubDeployment(main, sha) {
  const [deployment] = JSON.parse(command("gh", ["api", `repos/${repository}/deployments?sha=${sha}`], { cwd: main }));
  if (!deployment) return null;
  return JSON.parse(command("gh", ["api", `repos/${repository}/deployments/${deployment.id}/statuses`], { cwd: main }))[0]?.state ?? null;
}

async function waitForDeploy(main, sha) {
  const until = Date.now() + DEPLOY_WITHIN;
  for (;;) {
    const deploy = await deploymentStatus(sha, { github: (s) => githubDeployment(main, s) });
    if (deploy.state !== "pending") return deploy;
    if (Date.now() > until) return { state: "failed", reason: "production did not serve the merge within 45 minutes" };
    await new Promise((done) => setTimeout(done, MINUTE));
  }
}

function released(main, mergeSha) {
  git(main, "fetch", "--quiet", "origin", "main");
  return closedBy(git(main, "log", `${mergeSha}^1..${mergeSha}^2`, "--format=%B"));
}

/**
 * After the merge, never before: label and pop the tickets, push this task's
 * doc pages, close its worktree. For main, first wait until production serves
 * the merge, then close split parents and move prototype tags.
 */
export async function finish(root, { pr: number, docs = [] }) {
  const main = mainCheckout(root);
  const pr = viewPull(main, number);
  if (pr.state !== "MERGED") throw new Error(`PR #${number} is ${pr.state.toLowerCase()}, not merged. Finish runs after the merge.`);
  const target = pr.baseRefName;
  const sha = pr.mergeCommit.oid;
  const result = { pr: pr.url, target, sha };
  if (target === "main") {
    const deploy = await waitForDeploy(main, sha);
    if (deploy.state === "failed") return { ...result, state: "needs you", reason: deploy.reason };
    result.live = true;
    const open = afterRelease(main, released(main, sha));
    if (open.length) result.stillOpen = open;
    try { command(process.execPath, ["scripts/wireframe-tags.mjs", "--write"], { cwd: main }); } catch { result.tags = "prototype tags not updated"; }
  } else {
    const body = json(main, "pr", "view", String(number), "--json", "body").body;
    const issues = closedBy([body, git(main, "log", "-1", "--format=%B", pr.headRefOid)].join("\n"));
    markLanded(main, issues, join(resolve(main), ".floc/tmp"));
    if (issues.length) result.onDevelop = issues;
  }
  const shared = docs.length ? sharedDocs(main, pr.headRefName, docs) : {};
  result.docs = docs.length ? commitDocs(main, docs, pr.title) : [];
  if (result.docs.length && Object.keys(shared).length) result.docsAlsoCarry = shared;
  if (!pr.headRefName.startsWith("release/")) result.worktree = closeWorktree(main, pr.headRefName, target);
  return { ...result, state: "done" };
}
