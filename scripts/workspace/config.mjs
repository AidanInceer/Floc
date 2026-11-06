import { createHash, randomBytes } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "node:net";

const read = (file, fallback) => existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback;
const services = ["web", "metro", "docs", "wireframes", "e2e", "marketing"];
export const configFile = (root) => join(root, ".floc/workspace.json");

async function portAvailable(port) {
  return new Promise((done) => {
    const server = createServer();
    server.once("error", () => done(false));
    server.listen(port, "127.0.0.1", () => server.close(() => done(true)));
  });
}

async function allocate(root, common) {
  const lock = join(common, "floc-workspaces.lock");
  let handle;
  try { handle = openSync(lock, "wx"); }
  catch { throw new Error("Workspace allocation is busy; retry setup after the other setup finishes."); }
  try {
    const file = join(common, "floc-workspaces.json");
    const registry = read(file, {});
    if (registry[root]) return registry[root];
    const used = new Set(Object.values(registry));
    for (let base = 20000; base < 49000; base += 10) {
      if (used.has(base)) continue;
      if (!(await Promise.all(services.map((_, i) => portAvailable(base + i)))).every(Boolean)) continue;
      registry[root] = base;
      writeFileSync(file, JSON.stringify(registry, null, 2) + "\n");
      return base;
    }
    throw new Error("No free workspace port block.");
  } finally { closeSync(handle); unlinkSync(lock); }
}

// Why: the main checkout is the user's own loop — the emulator, adb reverse and
// the existing local.db expect these ports and that database.
const PRIMARY_PORTS = { web: 3000, metro: 8081, docs: 4173, wireframes: 4100, e2e: 3100, marketing: 4200 };

export async function prepareConfig(directory, common, { primary = false } = {}) {
  const root = resolve(directory);
  const existing = read(configFile(root), null);
  if (existing && existing.root !== root) throw new Error("Workspace config belongs to another checkout; do not copy .floc between worktrees.");
  const id = createHash("sha256").update(root).digest("hex").slice(0, 10);
  if (primary) {
    const config = { root, id, primary: true, host: "localhost", ports: PRIMARY_PORTS, database: null, files: null };
    mkdirSync(join(root, ".floc"), { recursive: true });
    writeFileSync(configFile(root), JSON.stringify(config, null, 2) + "\n");
    return { ...config, created: false };
  }
  mkdirSync(join(root, ".floc/data"), { recursive: true });
  mkdirSync(join(root, ".floc/files"), { recursive: true });
  const base = existing?.ports.web ?? await allocate(root, common);
  const config = existing ?? {
    root, id, host: `floc-${id}.localhost`,
    ports: Object.fromEntries(services.map((name, i) => [name, base + i])),
    database: `file:${join(root, ".floc/data/local.db").replaceAll("\\", "/")}`,
    files: join(root, ".floc/files"),
  };
  writeFileSync(configFile(root), JSON.stringify(config, null, 2) + "\n");
  const env = join(root, "floc/apps/web/.env");
  mkdirSync(join(root, "floc/apps/web"), { recursive: true });
  const managed = {
    TURSO_DATABASE_URL: config.database,
    FLOC_FILES_DIR: config.files.replaceAll("\\", "/"),
    BETTER_AUTH_URL: `http://${config.host}:${config.ports.web}`,
  };
  const created = !existsSync(env);
  if (created) {
    writeFileSync(env, [...Object.entries(managed).map(([key, value]) => `${key}=${value}`), `BETTER_AUTH_SECRET=${randomBytes(32).toString("hex")}`, ""].join("\n"));
  } else repointEnv(env, managed);
  return { ...config, created };
}

// Why: a worktree that was moved keeps an .env pointing at the old folder's database. Only lines setup wrote are touched.
function repointEnv(env, managed) {
  const text = readFileSync(env, "utf8");
  if (!/^TURSO_DATABASE_URL=file:.*\/\.floc\/data\/local\.db$/m.test(text)) return;
  const next = text.replace(/^(TURSO_DATABASE_URL|FLOC_FILES_DIR|BETTER_AUTH_URL)=.*$/gm, (_, key) => `${key}=${managed[key]}`);
  if (next !== text) writeFileSync(env, next);
}
