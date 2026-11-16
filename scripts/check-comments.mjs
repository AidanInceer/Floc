#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CODE_FILE = /^(?!.*(\/vendor\/|\.min\.js$)).*\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const DIRECTIVE =
  /^(\/\/|\/\*)\s*(eslint-disable|eslint-enable|eslint-env|@ts-expect-error|@ts-ignore|@ts-nocheck|@ts-check|\/\s*<reference|prettier-ignore|istanbul ignore|c8 ignore|v8 ignore|@vitest-environment|@jsxImportSource|biome-ignore|#__PURE__|@__PURE__|webpack[A-Z]|NOSONAR)/;

const kindFor = (file) =>
  /\.tsx$/.test(file) ? ts.ScriptKind.TSX : /\.(jsx)$/.test(file) ? ts.ScriptKind.JSX : /\.(ts|mts|cts)$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.JSX;

export function findComments(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kindFor(file));
  const seen = new Map();
  const collect = (ranges) => {
    for (const range of ranges ?? []) seen.set(range.pos, range);
  };
  const visit = (node) => {
    if (node.kind !== ts.SyntaxKind.JsxText) {
      collect(ts.getLeadingCommentRanges(text, node.pos));
      collect(ts.getTrailingCommentRanges(text, node.end));
    }
    for (const child of node.getChildren(source)) visit(child);
  };
  visit(source);
  return [...seen.values()]
    .sort((a, b) => a.pos - b.pos)
    .map((range) => ({ ...range, text: text.slice(range.pos, range.end), line: source.getLineAndCharacterOfPosition(range.pos).line + 1 }))
    .filter((comment) => !DIRECTIVE.test(comment.text));
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}

const toRepoPath = (p) => (isAbsolute(p) ? relative(root, p) : p).replaceAll("\\", "/");
const lines = (out) => out.split("\n").map((l) => l.trim()).filter(Boolean);

function check(file, text) {
  return findComments(file, text).map((c) => `  ${file}:${c.line}  ${c.text.split("\n")[0].trim().slice(0, 80)}`);
}

const fromDisk = (file) => check(file, readFileSync(resolve(root, file), "utf8"));

function staged(files) {
  const list = files.length ? files.map(toRepoPath) : lines(git(["diff", "--cached", "--name-only", "--diff-filter=ACM"]).out);
  return list.filter((f) => CODE_FILE.test(f)).flatMap((f) => check(f, git(["show", `:${f}`]).out));
}

function working() {
  const changed = lines(git(["diff", "HEAD", "--name-only", "--diff-filter=ACM"]).out);
  const untracked = lines(git(["ls-files", "--others", "--exclude-standard"]).out);
  return [...changed, ...untracked].filter((f) => CODE_FILE.test(f)).flatMap(fromDisk);
}

function all() {
  return lines(git(["ls-files"]).out).filter((f) => CODE_FILE.test(f)).flatMap(fromDisk);
}

function hook() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const path = input.tool_input?.file_path;
  if (!path) return [];
  const file = toRepoPath(path);
  if (file.startsWith("..") || !CODE_FILE.test(file)) return [];
  return fromDisk(file);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2);
  const modes = { "--staged": () => staged(rest), "--hook": hook, "--all": all, "--working": working };
  const problems = (modes[mode] ?? working)();
  if (problems.length) {
    console.error(`\nComments are not allowed in Floc code (AGENTS.md → Comments):\n\n${problems.join("\n")}\n`);
    console.error("  Fix: delete the comment. Put the reason in a name, a test, the commit message or the PR.\n");
    process.exit(mode === "--hook" ? 2 : 1);
  }
}
