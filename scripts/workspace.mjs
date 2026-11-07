import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { command, git } from "./delivery/process.mjs";
import { copyDevAccount, prepareConfig, configFile } from "./workspace/config.mjs";
import { installHooks } from "./workspace/hooks.mjs";
import { ensureDocs } from "./workspace/docs-link.mjs";
import { sweep } from "./workspace/sweep.mjs";
import { rows, table } from "./workspace/list.mjs";
import { baseFor, branchFor, folderFor, isPrimary, mainCheckout, worktreesDir } from "./workspace/worktrees.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [action = "status", ...args] = process.argv.slice(2);
const quiet = args.includes("--quiet");

// Why: a worktree database is a local file, so no Turso token may reach it; drizzle-kit rejects an empty one.
function withLocalDatabase(config, extra = {}) {
  const env = { ...process.env, ...localEnv(config), ...extra };
  if (!config.primary) delete env.TURSO_AUTH_TOKEN;
  return env;
}

function localEnv(config) {
  if (config.primary) return {};
  return { TURSO_DATABASE_URL: config.database, FLOC_FILES_DIR: config.files, BETTER_AUTH_URL: `http://${config.host}:${config.ports.web}` };
}

// Why: the preview pane reads only the main checkout's launch.json; a worktree opens its own server by URL instead.
const withUrl = (config) => ({ ...config, url: `http://${config.host}:${config.ports.web}` });

const seededMark = (config) => join(config.root, ".floc/data/seeded");

async function prepare() {
  if (process.env.CI) return { state: "skipped in CI" };
  const main = mainCheckout(root);
  const primary = isPrimary(root);
  const config = await prepareConfig(root, resolve(root, git(root, "rev-parse", "--git-common-dir")), { primary });
  const docs = ensureDocs(root, main, { primary });
  const install = !args.includes("--no-install");
  if (install) command("pnpm", ["install", "--frozen-lockfile", "--config.confirmModulesPurge=false"], { cwd: root, stdio: "inherit" });
  if (!primary) copyDevAccount(root, main);
  // Why: only this worktree's own database, and only once; a second seed would wipe what you tested with.
  if (install && !primary && !existsSync(seededMark(config))) {
    const env = withLocalDatabase(config);
    command("pnpm", ["--filter", "floc-web", "db:migrate"], { cwd: root, env, stdio: "inherit" });
    command("pnpm", ["--filter", "floc-web", "db:seed"], { cwd: root, env, stdio: "inherit" });
    writeFileSync(seededMark(config), new Date().toISOString());
  }
  installHooks(root);
  return { state: "prepared", root, primary, ports: config.ports, docs: docs.state, ...(docs.next && { next: docs.next }) };
}

function create() {
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) throw new Error("Usage: pnpm workspace:new <name>   (feature/<name> from develop; hotfix/<name> from main)");
  const main = mainCheckout(root);
  let swept = [];
  try { swept = sweep(main, null).filter((r) => r.removed && r.path).map((r) => r.path); } catch { swept = []; }
  const branch = branchFor(name);
  const base = baseFor(branch);
  const path = join(worktreesDir(main), folderFor(branch));
  if (existsSync(path)) throw new Error(`${path} already exists. Open a session there, or pick another name.`);
  git(main, "fetch", "--quiet", "origin", base);
  git(main, "worktree", "add", "--quiet", "--no-track", "-b", branch, path, `origin/${base}`);
  command(process.execPath, [join(path, "scripts/workspace.mjs"), "prepare"], { cwd: path, stdio: "inherit" });
  const ports = JSON.parse(readFileSync(configFile(path), "utf8")).ports;
  return { state: "ready", path, branch, base, ports, swept, next: `Open a session in ${path}` };
}

function start() {
  if (!existsSync(configFile(root))) throw new Error("Run pnpm workspace:prepare first.");
  const config = JSON.parse(readFileSync(configFile(root), "utf8"));
  const service = args[0];
  const definitions = {
    web: ["pnpm", ["--filter", "floc-web", "dev"]],
    metro: ["pnpm", ["--filter", "floc-mobile", "exec", "expo", "start", "--dev-client", "--port", String(config.ports.metro)]],
    docs: [process.execPath, ["scripts/docs-server.mjs"]],
    wireframes: [process.execPath, ["--experimental-strip-types", "scripts/wireframe-server.mjs"]],
  };
  if (!definitions[service]) throw new Error("Expected web, metro, docs or wireframes.");
  const env = withLocalDatabase(config, { PORT: String(config.ports[service]), FLOC_DOCS_PORT: String(config.ports.docs),
    FLOC_WIREFRAME_PORT: String(config.ports.wireframes), EXPO_PUBLIC_API_URL: `http://localhost:${config.ports.web}` });
  command(...definitions[service], { cwd: root, env, stdio: "inherit" });
}

try {
  let result;
  if (action === "prepare") result = await prepare();
  else if (action === "new") result = create();
  else if (action === "sweep") result = sweep(mainCheckout(root), root);
  else if (action === "finish") {
    const main = mainCheckout(root);
    if (resolve(main) === resolve(root)) throw new Error("Run finish from the task's worktree.");
    const mine = sweep(main, null).find((r) => r.path && resolve(r.path) === resolve(root));
    result = mine ?? { kept: "not a managed worktree" };
  } else if (action === "status") result = existsSync(configFile(root)) ? withUrl(JSON.parse(readFileSync(configFile(root), "utf8"))) : { state: "unprepared", next: "pnpm workspace:prepare" };
  else if (action === "list") {
    const found = rows(mainCheckout(root));
    if (args.includes("--json")) result = found;
    else console.log(table(found));
  }
  else if (action === "start") start();
  else throw new Error("Expected new, prepare, sweep, finish, status, list or start.");
  if (result && !(quiet && action === "prepare" && !result.next)) console.log(JSON.stringify(result));
} catch (error) {
  console.error(error.message);
  process.exitCode = quiet ? 0 : 1;
}
