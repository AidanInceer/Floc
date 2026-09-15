/**
 * The commit subject, checked before it exists rather than after it is pushed.
 *
 *   <version> #<issue>: <type>: <description>
 *   0.4.0 #93: feat: split the profile
 *
 * A wrong number in the body's `Closes` line shuts someone else's issue, and
 * on `main` that happens the moment the batch merges — which is far too late
 * to notice. `#no-ticket` is the escape hatch for work with no issue, and it
 * must not carry a `Closes`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const suppliedPath = process.argv[2];
const gitMessagePath = resolve(
  process.cwd(),
  execFileSync("git", ["rev-parse", "--git-path", "COMMIT_EDITMSG"], {
    encoding: "utf8",
  }).trim(),
);

if (!suppliedPath || resolve(process.cwd(), suppliedPath) !== gitMessagePath) {
  console.error("commit message path must be Git's COMMIT_EDITMSG file");
  process.exit(1);
}

const raw = readFileSync(gitMessagePath, "utf8");
const lines = raw.split("\n").filter((l) => !l.startsWith("#"));
const subject = (lines[0] ?? "").trim();

// A merge commit is written by git, not by us, and `develop` → `main` goes in
// as one deliberately.
if (/^(Merge|Revert) /.test(subject)) process.exit(0);

const SUBJECT =
  /^\d+\.\d+\.\d+ #(?:\d+|no-ticket): (?:feat|fix|docs|refactor|chore|test): \S.*$/;

const problems = [];

if (!SUBJECT.test(subject)) {
  problems.push(
    `subject does not match "<version> #<issue>: <type>: <description>"\n    got: ${subject}`,
  );
}

const body = lines.slice(1).join("\n");
const closes = /Closes AidanInceer\/Floc#(\d+)/.exec(body);
const ticket = /#(\d+|no-ticket):/.exec(subject);

if (ticket && ticket[1] !== "no-ticket" && !closes) {
  problems.push(`body must end "Closes AidanInceer/Floc#${ticket[1]}"`);
}
if (ticket && ticket[1] === "no-ticket" && closes) {
  problems.push("a #no-ticket commit must not close an issue");
}
if (closes && ticket && ticket[1] !== closes[1]) {
  problems.push(
    `subject says #${ticket[1]} but the body closes #${closes[1]} — one of them shuts the wrong issue`,
  );
}

if (problems.length) {
  console.error("\nCommit message rejected:\n");
  for (const p of problems) console.error(`  · ${p}`);
  console.error("\n  See plugins/floc/skills/push/SKILL.md → Land.\n");
  process.exit(1);
}
