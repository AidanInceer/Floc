import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { command, git } from "./process.mjs";
import { TASK_BRANCH } from "../workspace/worktrees.mjs";
import { requiredStatus } from "./status.mjs";

export const repository = "AidanInceer/Floc";
const SHARED = ["SonarQube analysis", "Secret scan", "Known vulnerabilities"];
export const requiredChecks = { develop: ["PR checks", ...SHARED], main: ["Release checks", ...SHARED] };
export const LANDED_CHECK = "Release checks";

export const gh = (root, ...args) => command("gh", [...args, "--repo", repository], { cwd: root });
export const json = (root, ...args) => JSON.parse(gh(root, ...args) || "null");

export function taskBranch(root) {
  const branch = git(root, "branch", "--show-current");
  if (!TASK_BRANCH.test(branch)) throw new Error(`"${branch}" is not a task branch. Start work with pnpm workspace:new <name>.`);
  if (git(root, "rev-parse", "--git-dir") === git(root, "rev-parse", "--git-common-dir")) throw new Error("Publish from the task's own worktree, not the main checkout.");
  return branch;
}

const PR_FIELDS = "number,url,state,isDraft,baseRefName,headRefOid,mergeCommit,mergeable,autoMergeRequest,statusCheckRollup,title";

export function pullRequest(root, branch, state = "all") {
  return json(root, "pr", "list", "--head", branch, "--state", state, "--json", PR_FIELDS)
    .sort((a, b) => b.number - a.number)[0] ?? null;
}

export const viewPull = (root, number) => json(root, "pr", "view", String(number), "--json", PR_FIELDS);

export function validateMessage(root, message) {
  const subject = message.split(/\r?\n/)[0];
  if (!/^#(?:no-ticket|\d+): (feat|fix|docs|refactor|chore|test): \S/.test(subject)) throw new Error("Subject must be #<issue|no-ticket>: <type>: <description>.");
  const issue = subject.match(/^#(\d+):/)?.[1];
  const closes = [...message.matchAll(/Closes AidanInceer\/Floc#(\d+)/g)].map((m) => m[1]);
  if (issue ? closes.length !== 1 || closes[0] !== issue : closes.length) throw new Error("A ticket subject needs exactly one matching Closes line; #no-ticket has none.");
  if (issue) {
    const ticket = json(root, "issue", "view", issue, "--json", "title,state");
    if (ticket.state !== "OPEN" || ticket.title.trim() === "Priority") throw new Error(`#${issue} must be an open ticket, never the Priority stack.`);
  }
  return { subject, issue };
}

export const closedBy = (text) => [...new Set([...text.matchAll(/Closes AidanInceer\/Floc#(\d+)/g)].map((m) => m[1]))];

export function withoutTickets(body, issues) {
  let n = 0;
  return body.split("\n").filter((line) => !issues.some((issue) => new RegExp(`^\\d+\\.\\s+#${issue}\\b`).test(line)))
    .map((line) => (/^\d+\.\s/.test(line) ? line.replace(/^\d+\./, `${++n}.`) : line)).join("\n");
}

/** A ticket leaves the Priority stack when its work lands on develop; it closes when that reaches main. */
export function markLanded(root, issues, scratch) {
  if (!issues.length) return;
  for (const issue of issues) gh(root, "issue", "edit", issue, "--add-label", "on-develop");
  const stack = json(root, "issue", "list", "--state", "open", "--search", "Priority in:title", "--json", "number,title,body")
    .find((i) => i.title.trim() === "Priority");
  if (!stack) return;
  const body = withoutTickets(stack.body, issues);
  if (body === stack.body) return;
  mkdirSync(scratch, { recursive: true });
  const file = join(scratch, `priority-${stack.number}.md`);
  writeFileSync(file, body);
  gh(root, "issue", "edit", String(stack.number), "--body-file", file);
}

export const splitChildren = (body) => /## Split into([\s\S]*?)(?:\n## |$)/.exec(body ?? "")?.[1]?.match(/#(\d+)/g)?.map((c) => c.slice(1)) ?? [];

// Why: no commit closes a split parent, so it closes here once every child has.
export function afterRelease(root, released) {
  const stillOpen = released.filter((issue) => json(root, "issue", "view", issue, "--json", "state").state !== "CLOSED");
  const parents = json(root, "issue", "list", "--state", "open", "--label", "on-develop", "--json", "number,body");
  for (const parent of parents) {
    const children = splitChildren(parent.body);
    if (children.length && children.every((c) => json(root, "issue", "view", c, "--json", "state").state === "CLOSED")) {
      gh(root, "issue", "close", String(parent.number), "--reason", "completed", "--comment", "All split tickets shipped.");
    }
  }
  return stillOpen;
}

export function landedState(root, sha) {
  const runs = JSON.parse(command("gh", ["api", `repos/${repository}/commits/${sha}/check-runs?per_page=100`], { cwd: root })).check_runs;
  return requiredStatus(runs, [LANDED_CHECK]);
}

export function waitsForChecks({ allowAutoMerge, rules }) {
  return Boolean(allowAutoMerge) && rules.some((rule) => rule.type === "required_status_checks");
}

/**
 * Why: without auto-merge allowed and required checks on the branch, GitHub
 * treats `gh pr merge --auto` as "merge now", before any check has run. The
 * watcher merges instead, once the checks pass.
 */
export function autoMerge(root, number, branch) {
  try {
    const allowAutoMerge = JSON.parse(command("gh", ["api", `repos/${repository}`], { cwd: root })).allow_auto_merge;
    const rules = JSON.parse(command("gh", ["api", `repos/${repository}/rules/branches/${branch}`], { cwd: root }));
    if (!waitsForChecks({ allowAutoMerge, rules })) return "off; the watcher merges once checks pass";
    gh(root, "pr", "merge", String(number), "--auto", "--merge");
    return "on";
  } catch {
    return "off; the watcher merges once checks pass";
  }
}
