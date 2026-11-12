import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { git } from "./process.mjs";
import { autoMerge, gh, pullRequest, taskBranch, validateMessage } from "./github.mjs";
import { mergeTarget } from "./sync.mjs";
import { requireReview } from "./review.mjs";
import { mainCheckout, targetFor } from "../workspace/worktrees.mjs";
import { sweep } from "../workspace/sweep.mjs";
import { bumpPlugin } from "./plugin-version.mjs";
import { HOLD, mergeMode } from "./ci.mjs";

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
  try { return sweep(main, current).filter((r) => r.removed && r.path).map((r) => r.path); } catch { return []; }
}

/**
 * Commit, merge the target in, push, open the PR. No checks run here: the
 * pre-commit hook is the local gate and CI on the PR is the real one
 * (AGENTS.md, Guardrail gates). Docs go out after the merge, in finish.
 */
export function publish(root, { messageFile, hold = false }) {
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
  const plugin = bumpPlugin(root, target);
  requireReview(root, `origin/${target}`);
  git(root, "push", "--quiet", "--set-upstream", "origin", `HEAD:refs/heads/${branch}`);
  let pr = pullRequest(root, branch, "open");
  if (!pr) {
    gh(root, "pr", "create", "--base", target, "--head", branch, "--title", subject, "--body-file", resolve(messageFile));
    pr = pullRequest(root, branch, "open");
  }
  const merging = mergeMode({ hold, pr }) === "hold" ? holdPull(root, pr) : autoMerge(root, pr.number, target);
  return {
    state: "published", pr: pr.url, number: pr.number, target, sha: git(root, "rev-parse", "HEAD"), ...(version && { version }), ...(plugin && { plugin }), autoMerge: merging, swept,
    next: `Start the floc:ci-watch agent in the background for PR #${pr.number}.`,
  };
}

function holdPull(root, pr) {
  gh(root, "label", "create", HOLD, "--color", "B60205", "--description", "Review first: ci-watch reports green and never merges", "--force");
  gh(root, "pr", "edit", String(pr.number), "--add-label", HOLD);
  if (pr.autoMergeRequest) gh(root, "pr", "merge", String(pr.number), "--disable-auto");
  return `held; remove the ${HOLD} label to let it merge`;
}
