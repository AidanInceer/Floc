/**
 * Why: tags are set by hand at each step, and a missed step left picks reading "Chosen"
 * long after they shipped. Main's version says a pick is live, so `--write` sweeps every pick.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(repo, "floc", "wireframe");
const write = process.argv.includes("--write");

function mainVersion() {
  for (const ref of ["origin/main", "main"]) {
    try {
      const pkg = execFileSync("git", ["show", `${ref}:floc/apps/web/package.json`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      return JSON.parse(pkg).version;
    } catch {
      continue;
    }
  }
  return null;
}

const older = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return true;
};

const STATUS = /(<meta name="wf-status" content=")([^"]*)(">)/;
const ON_DEVELOP = /^Chosen: (.+), on develop (\d+\.\d+\.\d+)$/;

const live = mainVersion();
const groups = { moved: [], develop: [], chosen: [], exploring: [], none: [] };

for (const folder of readdirSync(root).sort()) {
  const file = path.join(root, folder, "index.html");
  if (folder.startsWith("_") || !existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const status = html.match(STATUS)?.[2] ?? "";
  const word = status.split(/[:\s]/)[0].toLowerCase();
  const onDevelop = status.match(ON_DEVELOP);

  if (onDevelop && live && older(onDevelop[2], live)) {
    const next = `Shipped ${onDevelop[2]} as ${onDevelop[1]}`;
    groups.moved.push(`${folder}: ${status}  →  ${next}`);
    if (write) writeFileSync(file, html.replace(STATUS, `$1${next}$3`));
  } else if (onDevelop) groups.develop.push(`${folder}: ${status}`);
  else if (word === "chosen") groups.chosen.push(`${folder}: ${status}`);
  else if (word === "exploring") groups.exploring.push(`${folder}: ${status}`);
  else if (!status) groups.none.push(folder);
}

const section = (title, list) => list.length && console.log(`\n${title} (${list.length})\n${list.map((l) => `  ${l}`).join("\n")}`);
console.log(`main is ${live ?? "unknown (no main branch found)"}`);
section(write ? "Moved to Shipped" : "Would move to Shipped (run with --write)", groups.moved);
section("On develop, not on main yet", groups.develop);
section("Chosen, not on develop: built by a push yet? set 'on develop <version>' if so", groups.chosen);
section("Exploring: picked yet? set Chosen, Parked or Experiment", groups.exploring);
section("No wf-status", groups.none);
