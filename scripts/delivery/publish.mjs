import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { command, git } from "./process.mjs";
import { gh, pullRequest, taskBranch, validateMessage } from "./github.mjs";
import { mergeTarget } from "./sync.mjs";
import { requireReview } from "./review.mjs";
import { startWatcher } from "./schedule.mjs";
import { commitDocs } from "./docs.mjs";
import { mainCheckout, targetFor } from "../workspace/worktrees.mjs";
import { sweep } from "../workspace/sweep.mjs";

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = "floc/apps/web/package.json";

const versionAt = (root, ref) => JSON.parse(git(root, "show", `${ref}:${PACKAGE}`)).version;

// Why: a hotfix goes straight to main, so it takes the next patch version itself.
function bumpHotfix(root) {
  const live = versionAt(root, "origin/main");
  if (versionAt(root, "HEAD") !== live) return null;
  const [major, minor, patch] = live.split(".").map(Number);
  const next = `${major}.${minor}.${patch + 1}`;
  const path = join(root, PACKAGE);
  writeFileSync(path, readFileSync(path, "utf8").replace(`"version": "${live}"`, `"version": "${next}"`));
  git(root, "add", "--", PACKAGE);
  git(root, "commit", "-m", `#no-ticket: chore: hotfix version ${next}`);
  return next;
}

function safeSweep(main, current) {
  try { return sweep(main, current).filter((r) => r.removed).map((r) => r.path); } catch { return []; }
}

export function publish(root, { messageFile, docs = [] }) {
  const branch = taskBranch(root);
  const target = targetFor(branch);
  const main = mainCheckout(root);
  const swept = safeSweep(main, root);
  const { subject } = validateMessage(root, readFileSync(messageFile, "utf8"));
  if (git(root, "status", "--porcelain")) {
    git(root, "add", "-A");
    git(root, "commit", "-F", resolve(messageFile));
  }
  const merged = mergeTarget(root, target);
  if (merged.state === "conflict") throw new Error(`Merging ${target} conflicts in ${merged.files.join(", ")}. Resolve them, commit, then publish again.`);
  if (!git(root, "rev-list", `origin/${target}..HEAD`)) throw new Error(`Nothing to publish: no commits beyond ${target}.`);
  const version = target === "main" ? bumpHotfix(root) : null;
  requireReview(root, `origin/${target}`);
  command(process.execPath, ["scripts/checks/run.mjs", "quick", "--base", `origin/${target}`], { cwd: root, stdio: "inherit" });
  const pages = docs.length ? commitDocs(main, docs, subject) : [];
  git(root, "push", "--quiet", "--set-upstream", "origin", `HEAD:refs/heads/${branch}`);
  let pr = pullRequest(root, branch, "open");
  if (!pr) {
    gh(root, "pr", "create", "--base", target, "--head", branch, "--title", subject, "--body-file", resolve(messageFile));
    pr = pullRequest(root, branch, "open");
  }
  let autoMerge = "on";
  try { gh(root, "pr", "merge", String(pr.number), "--auto", "--merge"); }
  catch { autoMerge = "off; the watcher merges once checks pass"; }
  const watcher = startWatcher({ scripts, pr: pr.number, branch, target, main, worktree: root });
  return { state: "published", pr: pr.url, target, sha: git(root, "rev-parse", "HEAD"), ...(version && { version }), docs: pages, autoMerge, watcher: watcher.log, swept };
}
