#!/usr/bin/env node
/**
 * The mechanical half of `/floc:push`, so the skill stops re-deriving it each time.
 *
 * WHY A SCRIPT. Every step here has one right answer — the branch, the bump,
 * the two things `verify` cannot know, the commit, the push. Done by hand they
 * cost a tool call each and go wrong in the same three ways. What is left for
 * the skill is the half a script cannot have an opinion about: the commit
 * message, the issue number, and whether an unexpected diff is wanted.
 *
 * TWO COMMANDS, ONE GATE BETWEEN THEM. `preflight` refuses, bumps and verifies;
 * `land` commits and pushes. They are separate because the message is written
 * between them, with the changed files in hand.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_PACKAGE = join(root, "floc", "apps", "web", "package.json");
const BRANCH = "develop";

/** feat is the only minor. Everything else is a patch (CLAUDE.md). */
const MINOR_TYPES = new Set(["feat"]);
const TYPES = ["feat", "fix", "docs", "refactor", "chore", "test"];

/**
 * No `shell: true`, and so no `pnpm` either.
 *
 * The shell concatenates rather than escapes its arguments — Node
 * deprecation-warns about it (DEP0190), and a commit subject is exactly the
 * free text that would go through it. Without a shell, Node 24 refuses to
 * spawn `pnpm.cmd` at all (EINVAL, deliberately). Every command here is a real
 * executable instead: `git`, and Node running `verify.mjs` the way `pnpm
 * verify` would have.
 */
function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) die(`could not run ${command}: ${result.error.message}`);
  return { status: result.status ?? 1, out: result.stdout ?? "" };
}

/** Trimmed, so it is safe for single values. Porcelain output uses `run`. */
function git(...args) {
  return run("git", args, { capture: true }).out.trim();
}

function die(message) {
  console.error(`\n  x ${message}\n`);
  process.exit(1);
}

function say(mark, message) {
  console.log(`  ${mark} ${message}`);
}

function version() {
  return JSON.parse(readFileSync(WEB_PACKAGE, "utf8")).version;
}

/** Bumped already? Then this is a retry after a red verify, not a second bump. */
function committedVersion() {
  const raw = git("show", `HEAD:floc/apps/web/package.json`);
  return raw ? JSON.parse(raw).version : null;
}

function bump(type) {
  const [major, minor, patch] = version().split(".").map(Number);
  return MINOR_TYPES.has(type)
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;
}

function setVersion(next) {
  const raw = readFileSync(WEB_PACKAGE, "utf8");
  writeFileSync(WEB_PACKAGE, raw.replace(/"version": "[^"]+"/, `"version": "${next}"`));
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

function preflight(type) {
  if (!TYPES.includes(type)) die(`type must be one of: ${TYPES.join(" | ")}`);

  console.log("\n-- Guards");
  const branch = git("branch", "--show-current");
  if (branch !== BRANCH) die(`on "${branch}" — a feature only ever lands on ${BRANCH}`);
  say("ok", `on ${BRANCH}`);

  const files = changedFiles();
  if (files.length === 0) die("nothing to push — the working tree is clean");
  say("ok", `${files.length} file(s) changed`);
  for (const file of files) console.log(`        ${file}`);

  console.log("\n-- What verify cannot know");
  const schema = files.some((f) => f.includes("db/schema.ts") || f.startsWith("floc/drizzle/"));
  const api = files.some((f) => f.startsWith("floc/packages/floc-api/src/"));
  if (schema) {
    say("!!", "schema touched — the new drizzle/*.sql must be applied to local.db");
  }
  if (api) {
    say("!!", "floc-api touched — a new procedure needs its parity.json line and a `why`");
  }
  if (!schema && !api) say("ok", "no schema or API change");

  console.log("\n-- Version");
  const current = version();
  const committed = committedVersion();
  if (committed && current !== committed) {
    say("ok", `already at ${current} (was ${committed}) — leaving it`);
  } else {
    const next = bump(type);
    setVersion(next);
    say("ok", `${current} -> ${next} (${type})`);
  }

  console.log("\n-- Verify\n");
  const verify = run(process.execPath, [join(root, "scripts", "verify.mjs")]);
  if (verify.status !== 0) {
    die("verify is red — fix it, then run preflight again (the bump is kept)");
  }

  console.log(`\n  Ready. Commit subject starts: "${version()} #<issue>: ${type}: ..."`);
  console.log("  Write the message, then: node scripts/push.mjs land --message-file <path>\n");
}

function land(messageFile) {
  if (!messageFile) die("land needs --message-file <path>");

  let message;
  try {
    message = readFileSync(messageFile, "utf8");
  } catch {
    die(`cannot read the message file: ${messageFile}`);
  }

  const subject = message.split("\n")[0].trim();
  if (!subject.startsWith(`${version()} `)) {
    die(`subject must start with the bumped version "${version()}" — got: ${subject}`);
  }
  if (!/^\S+ #(no-ticket|\d+): (feat|fix|docs|refactor|chore|test): .+/.test(subject)) {
    die(`subject is not "<version> #<issue>: <type>: <description>" — got: ${subject}`);
  }

  console.log("\n-- Commit");
  if (run("git", ["add", "-A"]).status !== 0) die("git add failed");
  if (run("git", ["commit", "-F", messageFile]).status !== 0) die("git commit failed");
  say("ok", subject);

  console.log("\n-- Push");
  if (run("git", ["push", "origin", BRANCH]).status !== 0) {
    die(`push rejected — "git pull --rebase origin ${BRANCH}", then run verify again`);
  }
  say("ok", `${git("rev-parse", "--short", "HEAD")} -> ${BRANCH}`);

  const issue = subject.match(/#(\d+):/)?.[1];
  console.log(
    issue
      ? `\n  Next: label #${issue} "on-develop" and pop it off the Priority stack.\n`
      : "\n  No ticket — nothing to label.\n",
  );
}

const [command, ...rest] = process.argv.slice(2);
if (command === "preflight") preflight(rest[0]);
else if (command === "land") land(rest[rest.indexOf("--message-file") + 1]);
else {
  console.error("usage: push.mjs preflight <type> | push.mjs land --message-file <path>");
  process.exit(1);
}
