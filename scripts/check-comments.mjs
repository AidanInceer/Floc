#!/usr/bin/env node
// Flags comments that are almost always noise, on added lines only (CLAUDE.md → Comments).
// --staged [files]: pre-commit · --working: changes since HEAD · --hook: Claude PostToolUse,
// where exit 2 is what feeds the report back to Claude.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CODE_FILE = /^(?!.*(\/vendor\/|\.min\.js$|^floc\/wireframe\/)).*\.(ts|tsx|js|jsx|mjs|cjs)$/;
const MAX_LINES = 3;

const DIRECTIVE =
  /^\s*(eslint|@ts-|prettier-ignore|istanbul|c8 |@vitest|webpack|biome-ignore|#region|#endregion|global |\/\s*<reference)|^\s*@(type|typedef|param|returns|satisfies|template|import)\b/;
const JUSTIFIED = /#\d+|\bticket \d+/i;
const WHY = /^\s*why:/i;
const DIVIDER = /^\s*[-=*#_~]{3,}|[-=]{4,}/;
const CODE_LINE =
  /^\s*(const|let|var|import|export|return|if|for|while|await|function|class)\b|[;{}]\s*$|^\s*[\w$.]+\(.*\)\s*;?\s*$/;
const WHAT_OPENER =
  /^\s*(returns?|gets?|sets?|creates?|formats?|handles?|renders?|builds?|computes?|parses?|converts?|helpers?|utility|wrapper|this (function|component|hook|file|module))\b/i;
const DECLARATION =
  /^\s*(export\s+)?(default\s+)?(async\s+)?(function\b|class\b|interface\b|type\s+\w+\s*=|(const|let)\s+[\w$]+\s*(:[^=]+)?=\s*(async\s*)?(\(|function\b|[\w$]+\s*=>))/;
const STOP = new Set(
  "the and for with this that from into then than when what which each are was were has have not but its it's our can use uses used all any get set new one two".split(" "),
);

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}

function addedLines(diff) {
  const lines = new Set();
  for (const hunk of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(hunk[1]);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
    for (let i = 0; i < count; i++) lines.add(start + i);
  }
  return lines;
}

function extractComments(src) {
  const found = [];
  let i = 0;
  let line = 1;
  let lineHasCode = false;
  let quote = null;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "\n") {
      line++;
      lineHasCode = false;
      if (quote !== "`") quote = null;
      i++;
    } else if (quote) {
      if (c === "\\") {
        if (next === "\n") line++;
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
    } else if (c === "/" && next === "/") {
      const stop = src.indexOf("\n", i) === -1 ? src.length : src.indexOf("\n", i);
      found.push({ kind: "line", start: line, end: line, ownLine: !lineHasCode, body: [src.slice(i + 2, stop)] });
      i = stop;
    } else if (c === "/" && next === "*") {
      const close = src.indexOf("*/", i + 2);
      const raw = src.slice(i + 2, close === -1 ? src.length : close);
      const start = line;
      line += raw.split("\n").length - 1;
      found.push({
        kind: raw.startsWith("*") ? "doc" : "block",
        start,
        end: line,
        ownLine: !lineHasCode,
        body: raw.split("\n").map((l) => l.replace(/^\s*\*+\/?|\*+$/g, "")),
      });
      i = close === -1 ? src.length : close + 2;
    } else {
      if (c === "'" || c === '"' || c === "`") quote = c;
      if (!/\s/.test(c)) lineHasCode = true;
      i++;
    }
  }
  return groupLineComments(found);
}

function groupLineComments(comments) {
  const groups = [];
  for (const comment of comments) {
    const last = groups.at(-1);
    const joins = last && comment.kind === "line" && last.kind === "line" && comment.ownLine && last.ownLine && comment.start === last.end + 1;
    if (joins) {
      last.end = comment.end;
      last.body.push(...comment.body);
    } else {
      groups.push({ ...comment, body: [...comment.body] });
    }
  }
  return groups;
}

function words(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => w.replace(/s$/, ""));
}

function nextCodeLine(lines, after) {
  for (let i = after; i < lines.length; i++) {
    const text = lines[i].trim();
    if (text && !/^(\/\/|\/\*|\*)/.test(text)) return text;
  }
  return "";
}

function restates(comment, code) {
  const said = words(comment.join(" "));
  if (said.length === 0 || said.length > 6 || !code) return false;
  const named = new Set(words(code));
  return said.filter((w) => named.has(w)).length / said.length >= 0.6;
}

function judge(group, lines) {
  const body = group.body.filter((l) => l.trim());
  const text = body.join("\n");
  if (body.length === 0 || DIRECTIVE.test(body[0])) return null;
  if (DIVIDER.test(body[0])) return "section divider — the file layout already shows it";
  if (body.filter((l) => CODE_LINE.test(l)).length * 2 >= body.length) return "commented-out code — git keeps the history";
  if (JUSTIFIED.test(text) || WHY.test(body[0]) || !group.ownLine) return null;
  if (body.length > MAX_LINES) return `${body.length}-line comment — cut to ${MAX_LINES}, or name the ticket (#123), or start with "Why:"`;
  const code = nextCodeLine(lines, group.end);
  if (DECLARATION.test(code) && WHAT_OPENER.test(body[0])) return "summary above a declaration — the name should say it";
  if (restates(body, code)) return "repeats the next line — delete it";
  return null;
}

function check(file, text, added) {
  const lines = text.split("\n");
  const problems = [];
  for (const group of extractComments(text)) {
    let touched = !added;
    for (let l = group.start; !touched && l <= group.end; l++) touched = added.has(l);
    if (!touched) continue;
    const problem = judge(group, lines);
    if (problem) problems.push(`  ${file}:${group.start}  ${problem}`);
  }
  return problems;
}

const toRepoPath = (p) => (isAbsolute(p) ? relative(root, p) : p).replaceAll("\\", "/");

function changedSinceHead(file) {
  const tracked = git(["ls-files", "--error-unmatch", "--", file]).ok;
  const added = tracked ? addedLines(git(["diff", "HEAD", "-U0", "--", file]).out) : null;
  return check(file, readFileSync(resolve(root, file), "utf8"), added);
}

function staged(files) {
  const list = files.length ? files.map(toRepoPath) : git(["diff", "--cached", "--name-only", "--diff-filter=ACM"]).out.split("\n");
  return list
    .filter((f) => CODE_FILE.test(f))
    .flatMap((f) => check(f, git(["show", `:${f}`]).out, addedLines(git(["diff", "--cached", "-U0", "--", f]).out)));
}

function working() {
  const changed = git(["diff", "HEAD", "--name-only", "--diff-filter=ACM"]).out.split("\n");
  const untracked = git(["ls-files", "--others", "--exclude-standard"]).out.split("\n");
  return [...changed, ...untracked].filter((f) => CODE_FILE.test(f)).flatMap(changedSinceHead);
}

function hook() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const path = input.tool_input?.file_path;
  if (!path) return [];
  const file = toRepoPath(path);
  if (file.startsWith("..") || !CODE_FILE.test(file)) return [];
  return changedSinceHead(file);
}

const [mode, ...rest] = process.argv.slice(2);
const problems = mode === "--staged" ? staged(rest) : mode === "--hook" ? hook() : working();

if (problems.length) {
  console.error(`\nComments that read as noise:\n\n${problems.join("\n")}\n`);
  console.error("  Fix: delete the comment, or keep only the why — short, or with its ticket or \"Why:\".\n");
  process.exit(mode === "--hook" ? 2 : 1);
}
