import { basename, dirname, resolve } from "node:path";
import { command, git } from "../delivery/process.mjs";
import { isScratch, listWorktrees, worktreesDir } from "./worktrees.mjs";

export function kindOf({ path, branch }, main) {
  if (resolve(path).toLowerCase() === resolve(main).toLowerCase()) return "main";
  if (!resolve(path).toLowerCase().startsWith(worktreesDir(main).toLowerCase())) return "other tool";
  if (branch?.startsWith("release/") || (!branch && basename(path).startsWith("release-"))) return "release";
  return isScratch(branch) ? "scratch" : "task";
}

/** The one-line state a person needs: where the work is and what it waits on. */
export function stateOf(row) {
  if (row.kind === "main") return [row.dirty && `${row.dirty} changed files`, row.behind && `${row.behind} commits behind develop`].filter(Boolean).join("; ") || "current with develop";
  if (row.pr?.state === "OPEN") return `PR #${row.pr.number} open`;
  if (row.pr?.state === "MERGED" && !row.ahead) return `PR #${row.pr.number} landed; sweep removes it`;
  if (row.dirty) return `${row.dirty} unsaved changes`;
  if (row.ahead) return `${row.ahead} commits not on develop`;
  return row.kind === "main" ? "main checkout" : "nothing of its own";
}

export function table(rows) {
  const columns = ["where", "kind", "branch", "age", "state"];
  const cells = rows.map((r) => [r.where, r.kind, r.branch ?? "(detached)", r.age, stateOf(r)]);
  const widths = columns.map((c, i) => Math.max(c.length, ...cells.map((row) => row[i].length)));
  const line = (values) => values.map((v, i) => v.padEnd(widths[i])).join("  ").trimEnd();
  return [line(columns), ...cells.map(line)].join("\n");
}

function pullRequests(main) {
  try {
    const list = JSON.parse(command("gh", ["pr", "list", "--state", "all", "--limit", "200", "--json", "number,state,headRefName"], { cwd: main }));
    const latest = new Map();
    for (const pr of list.sort((a, b) => a.number - b.number)) latest.set(pr.headRefName, pr);
    return latest;
  } catch { return new Map(); }
}

export function rows(main) {
  try { git(main, "fetch", "--quiet", "origin", "develop"); } catch { /* Why: offline still lists what is local. */ }
  const prs = pullRequests(main);
  return listWorktrees(main).map((w) => {
    const safe = (...args) => { try { return git(w.path, ...args); } catch { return ""; } };
    const kind = kindOf(w, main);
    return {
      where: kind === "main" ? "main checkout" : kind === "other tool" ? `${basename(dirname(dirname(w.path)))}/${basename(dirname(w.path))}/${basename(w.path)}` : basename(w.path),
      kind,
      branch: w.branch,
      age: safe("log", "-1", "--format=%cr") || "?",
      dirty: safe("--no-optional-locks", "status", "--porcelain", ...(kind === "main" ? ["--untracked-files=no"] : [])).split(/\r?\n/).filter(Boolean).length,
      ahead: Number(safe("rev-list", "--count", "origin/develop..HEAD") || 0),
      behind: Number(safe("rev-list", "--count", "HEAD..origin/develop") || 0),
      pr: w.branch && kind !== "main" ? prs.get(w.branch) : undefined,
    };
  });
}
