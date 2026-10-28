#!/usr/bin/env node
// The mechanical half of `/floc:push`; the skill keeps what a script cannot judge.
// Two commands because the commit message is written between them.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_PACKAGE = "floc/apps/web/package.json";
const PLUGIN_MANIFEST = "plugins/floc/.claude-plugin/plugin.json";
const REPO = "AidanInceer/Floc";
const BRANCH = "develop";

const MINOR_TYPES = new Set(["feat"]);
const TYPES = ["feat", "fix", "docs", "refactor", "chore", "test"];

// Why: no `shell: true` — a shell concatenates arguments (DEP0190) and a commit
// subject is free text. Without a shell Node 24 will not spawn `pnpm.cmd`, so
// only real executables run here: `git`, `gh`, and Node itself.
function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) die(`could not run ${command}: ${result.error.message}`);
  return { status: result.status ?? 1, out: result.stdout ?? "", err: result.stderr ?? "" };
}

/** Trimmed, so it is safe for single values. Porcelain output uses `run`. */
function git(...args) {
  return run("git", args, { capture: true }).out.trim();
}

function gh(...args) {
  return run("gh", args, { capture: true });
}

function die(message) {
  console.error(`\n  x ${message}\n`);
  process.exit(1);
}

function say(mark, message) {
  console.log(`  ${mark} ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function committedJson(path) {
  const raw = git("show", `HEAD:${path}`);
  return raw ? JSON.parse(raw) : null;
}

function version() {
  return readJson(WEB_PACKAGE).version;
}

function bump(type) {
  const [major, minor, patch] = version().split(".").map(Number);
  return MINOR_TYPES.has(type)
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;
}

function setVersion(next) {
  const path = join(root, WEB_PACKAGE);
  const raw = readFileSync(path, "utf8");
  writeFileSync(path, raw.replace(/"version": "[^"]+"/, `"version": "${next}"`));
}

/**
 * Untrimmed on purpose: a modified-but-unstaged line starts with a space, and
 * trimming the whole capture eats it — which takes a character off the first
 * filename and nothing off the rest.
 */
function changedFiles() {
  return run("git", ["status", "--porcelain"], { capture: true })
    .out.split("\n")
    .filter((line) => line.trim())
    .map((line) => line.slice(3).trim());
}

/** A linked worktree has its own git dir; the main checkout's is the common one. */
function inLinkedWorktree() {
  return resolve(root, git("rev-parse", "--git-dir")) !== resolve(root, git("rev-parse", "--git-common-dir"));
}

/**
 * Checked before verify, so a moved `develop` does not cost a second verify.
 * Why: git will not check `develop` out in two worktrees, so a session in its own
 * worktree sits on a throwaway branch and lands its commit on `develop` by refspec.
 */
function guardBranch() {
  const branch = git("branch", "--show-current");
  if (branch === BRANCH) say("ok", `on ${BRANCH}`);
  else if (inLinkedWorktree()) say("ok", `worktree branch "${branch}" — lands on ${BRANCH}`);
  else die(`on "${branch}" — a feature only ever lands on ${BRANCH}`);

  if (run("git", ["fetch", "--quiet", "origin", BRANCH]).status !== 0) {
    die(`could not fetch origin/${BRANCH}`);
  }
  const behind = Number(git("rev-list", "--count", `HEAD..origin/${BRANCH}`));
  if (behind > 0) {
    die(`${BRANCH} is ${behind} commit(s) behind origin — "git pull --rebase --autostash origin ${BRANCH}", then preflight again`);
  }
  const ahead = Number(git("rev-list", "--count", `origin/${BRANCH}..HEAD`));
  if (ahead > 0) {
    say("!!", `${ahead} local commit(s) not pushed yet — one commit per ticket; ask before squashing`);
  }
}

/** Claude reads a cached copy of the plugin, refreshed only when its version moves. */
function guardPluginVersion(files) {
  const touched = files.some((f) => f.startsWith("plugins/floc/") && f !== PLUGIN_MANIFEST);
  if (!touched) return;
  const before = committedJson(PLUGIN_MANIFEST)?.version;
  const now = readJson(PLUGIN_MANIFEST).version;
  if (before && before === now) {
    die(`plugins/floc changed but ${PLUGIN_MANIFEST} is still ${now} — bump "version", then "claude plugin update floc@floc --scope project"`);
  }
  say("ok", `floc plugin ${before ?? "new"} -> ${now}`);
}

function warnVerifyBlindSpots(files) {
  const schema = files.some((f) => f.includes("db/schema.ts") || f.startsWith("floc/apps/web/drizzle/"));
  const api = files.some((f) => f.startsWith("floc/packages/floc-api/src/"));
  if (schema) say("!!", "schema touched — the new drizzle/*.sql must be applied to local.db");
  if (api) say("!!", "floc-api touched — a new procedure needs its parity.json line and a `why`");
  if (!schema && !api) say("ok", "no schema or API change");
}

/** Bumped already? Then this is a retry after a red verify, not a second bump. */
function applyBump(type) {
  const current = version();
  const committed = committedJson(WEB_PACKAGE)?.version;
  if (committed && current !== committed) {
    say("ok", `already at ${current} (was ${committed}) — leaving it`);
    return;
  }
  const next = bump(type);
  setVersion(next);
  say("ok", `${current} -> ${next} (${type})`);
}

function preflight(type) {
  if (!TYPES.includes(type)) die(`type must be one of: ${TYPES.join(" | ")}`);

  console.log("\n-- Guards");
  guardBranch();
  if (run(process.execPath, [join(root, "scripts/sync-floc-plugin.mjs"), "--refresh"]).status !== 0) {
    die("Floc plugin sync failed — fix it before pushing");
  }
  const files = changedFiles();
  if (files.length === 0) die("nothing to push — the working tree is clean");
  say("ok", `${files.length} file(s) changed`);
  for (const file of files) console.log(`        ${file}`);
  guardPluginVersion(files);

  console.log("\n-- What verify cannot know");
  warnVerifyBlindSpots(files);

  console.log("\n-- Version");
  applyBump(type);

  console.log("\n-- Verify\n");
  const verify = run(process.execPath, [join(root, "scripts", "verify.mjs")]);
  if (verify.status !== 0) {
    die("verify is red — fix it, then run preflight again (the bump is kept)");
  }

  console.log(`\n  Ready. Commit subject starts: "${version()} #<issue>: ${type}: ..."`);
  console.log("  Write the message, then: pnpm push:land --message-file <path>\n");
}

function readMessage(messageFile) {
  if (!messageFile) die("land needs --message-file <path>");
  try {
    return readFileSync(messageFile, "utf8");
  } catch {
    return die(`cannot read the message file: ${messageFile}`);
  }
}

function checkSubject(subject) {
  if (!subject.startsWith(`${version()} `)) {
    die(`subject must start with the bumped version "${version()}" — got: ${subject}`);
  }
  if (!/^\S+ #(no-ticket|\d+): (feat|fix|docs|refactor|chore|test): .+/.test(subject)) {
    die(`subject is not "<version> #<issue>: <type>: <description>" — got: ${subject}`);
  }
}

/** A wrong number shuts someone else's issue when the batch reaches main. */
function checkTicket(issue) {
  const view = gh("issue", "view", issue, "--repo", REPO, "--json", "state,title,labels");
  if (view.status !== 0) die(`#${issue} is not an issue in ${REPO} — never invent a number; use #no-ticket`);
  const { state, title, labels } = JSON.parse(view.out);
  const names = labels.map((l) => l.name);
  if (state !== "OPEN") die(`#${issue} is ${state.toLowerCase()} — wrong number?`);
  if (title.trim() === "Priority") die(`#${issue} is the Priority stack, not a ticket`);
  if (names.includes("on-develop")) die(`#${issue} is already on-develop — a second commit for one ticket?`);
  say("ok", `#${issue} ${title}`);
}

function markOnDevelop(issue) {
  const edit = gh("issue", "edit", issue, "--repo", REPO, "--add-label", "on-develop");
  if (edit.status !== 0) {
    say("!!", `could not label #${issue}: ${edit.err.trim()} — gh issue edit ${issue} --repo ${REPO} --add-label on-develop`);
    return;
  }
  say("ok", `#${issue} labelled on-develop`);
}

function withoutTicket(body, issue) {
  const line = new RegExp(`^\\d+\\.\\s+#${issue}\\b`);
  let position = 0;
  return body
    .split("\n")
    .filter((l) => !line.test(l))
    .map((l) => (/^\d+\.\s/.test(l) ? l.replace(/^\d+\./, `${++position}.`) : l))
    .join("\n");
}

function popPriority(issue) {
  const list = gh("issue", "list", "--repo", REPO, "--state", "open", "--search", "Priority in:title",
    "--json", "number,title,body");
  const stack = list.status === 0 ? JSON.parse(list.out).find((i) => i.title.trim() === "Priority") : null;
  if (!stack) {
    say("!!", "no Priority issue found — nothing popped");
    return;
  }
  const body = withoutTicket(stack.body, issue);
  if (body === stack.body) {
    say("ok", `#${issue} was not in the Priority stack`);
    return;
  }
  const file = join(tmpdir(), `floc-priority-${stack.number}.md`);
  writeFileSync(file, body);
  const edit = gh("issue", "edit", String(stack.number), "--repo", REPO, "--body-file", file);
  if (edit.status !== 0) {
    say("!!", `could not update Priority #${stack.number}: ${edit.err.trim()}`);
    return;
  }
  say("ok", `#${issue} popped off Priority #${stack.number}`);
}

/**
 * Why: `git add -A` sweeps in another session's half-finished files when two
 * pieces of work share a checkout. `--only` stages exactly the named paths.
 */
function stage(only) {
  if (only.length === 0) {
    if (run("git", ["add", "-A"]).status !== 0) die("git add failed");
    return;
  }
  if (run("git", ["add", "-A", "--", ...only]).status !== 0) die("git add failed");
  const left = changedFiles().filter((line) => !only.some((p) => line === p || line.startsWith(p.replace(/\/?$/, "/"))));
  say("ok", `staged only: ${only.join(", ")}`);
  if (left.length > 0) say("!!", `${left.length} changed file(s) left out`);
}

function land(messageFile, only) {
  const message = readMessage(messageFile);
  const subject = message.split("\n")[0].trim();
  checkSubject(subject);
  const issue = subject.match(/#(\d+):/)?.[1];

  console.log("\n-- Ticket");
  if (issue) checkTicket(issue);
  else say("ok", "#no-ticket");

  console.log("\n-- Commit");
  if (run("git", ["add", "-A"]).status !== 0) die("git add failed");
  if (run("git", ["commit", "-F", messageFile]).status !== 0) die("git commit failed");
  say("ok", subject);

  console.log("\n-- Push");
  if (run("git", ["push", "origin", `HEAD:${BRANCH}`]).status !== 0) {
    die(`push rejected — "git pull --rebase origin ${BRANCH}", then run verify again`);
  }
  const sha = git("rev-parse", "HEAD");
  say("ok", `${sha.slice(0, 7)} -> ${BRANCH}`);

  if (issue) {
    console.log("\n-- Ticket state");
    markOnDevelop(issue);
    popPriority(issue);
  }
  console.log(`\n  Pushed ${sha}. Watch CI: node scripts/ci-watch.mjs ${sha}\n`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === "preflight") preflight(rest[0]);
else if (command === "land") {
  const at = rest.indexOf("--only");
  const only = at === -1 ? [] : rest.slice(at + 1).filter((a) => !a.startsWith("--"));
  land(rest[rest.indexOf("--message-file") + 1], only);
}
else {
  console.error("usage: push.mjs preflight <type> | push.mjs land --message-file <path> [--only <path>...]");
  process.exit(1);
}
