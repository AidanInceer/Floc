import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { command, git } from "../delivery/process.mjs";
import { workingTree } from "../quality/preflight.mjs";
import { commandFor, onlyChecks, selectedChecks } from "./manifest.mjs";
import { digest, reusable } from "./receipts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const profile = args[0] ?? "release";
const option = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
const baseRef = option("--base", process.env.FLOC_CHECK_BASE ?? (profile === "release" ? "origin/main" : "origin/develop"));

function coverageFiles() {
  const properties = readFileSync(join(root, "sonar-project.properties"), "utf8");
  return [...properties.matchAll(/^sonar.javascript.lcov.reportPaths=(.+)$/gm)]
    .flatMap((m) => m[1].trim().split(",")).map((p) => join(root, p)).filter(existsSync);
}

function runCheck(check, base, env, directory) {
  const log = join(directory, `${check.id}.log`);
  const handle = openSync(log, "w");
  const started = Date.now();
  try {
    const [name, ...taskArgs] = commandFor(check, profile, base);
    command(name === "node" ? process.execPath : name, taskArgs, { cwd: root, env, stdio: ["ignore", handle, handle] });
    return { passed: true, log, seconds: (Date.now() - started) / 1000 };
  } catch {
    return { passed: false, log, seconds: (Date.now() - started) / 1000 };
  } finally { closeSync(handle); }
}

try {
  const base = git(root, "rev-parse", "--verify", `${baseRef}^{commit}`);
  const paths = [...new Set([
    ...git(root, "diff", "--name-only", base, "--").split("\n"),
    ...git(root, "ls-files", "--others", "--exclude-standard").split("\n"),
  ].filter(Boolean))];
  const wanted = option("--only", "").split(",").filter(Boolean);
  const all = selectedChecks(profile, paths, args.includes("--full"));
  const selected = wanted.length ? onlyChecks(all, wanted) : all;
  if (args.includes("--plan")) {
    console.log(JSON.stringify({ profile, base, paths, checks: selected.map((c) => c.id) }, null, 2));
  } else {
    const tree = workingTree(root);
    const directory = join(root, ".floc/checks");
    mkdirSync(directory, { recursive: true });
    const receiptFile = join(directory, "receipts.json");
    const receipts = existsSync(receiptFile) ? JSON.parse(readFileSync(receiptFile, "utf8")) : {};
    const configPath = join(root, ".floc/workspace.json");
    const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : null;
    const env = { ...process.env, FLOC_CHECK_BASE: base, FLOC_NEXT_DIST_DIR: ".next-verify", FLOC_VERIFY_BUILD: "1",
      FLOC_NODE_VERSION: process.version, FLOC_E2E_PORT: String(config?.ports.e2e ?? 3100) };
    const identity = [tree, base, process.version, process.platform, process.arch, digest(readFileSync(new URL("./manifest.mjs", import.meta.url))), env.FLOC_E2E_PORT];
    const results = [];
    for (const check of selected) {
      const fingerprint = digest(JSON.stringify([...identity, commandFor(check, profile, base)]));
      if (!args.includes("--fresh") && reusable(receipts[check.id], fingerprint, check)) {
        results.push({ check: check.id, state: "reused" });
        console.log(`${check.id}: reused`);
        continue;
      }
      let { passed, log, seconds } = runCheck(check, base, env, directory);
      if (passed && workingTree(root) !== tree) { passed = false; console.error("Files changed during the checks; run them again on the final diff."); }
      if (!passed) console.error(readFileSync(log, "utf8").split(/\r?\n/).slice(-45).join("\n"));
      const artifacts = check.coverage ? coverageFiles() : check.id === "build" ? [join(root, "floc/apps/web/.next-verify/BUILD_ID")] : [];
      if (passed) receipts[check.id] = { fingerprint, finishedAt: new Date().toISOString(), artifacts,
        artifactHashes: Object.fromEntries(artifacts.filter(existsSync).map((p) => [p, digest(readFileSync(p))])) };
      else delete receipts[check.id];
      writeFileSync(receiptFile, JSON.stringify(receipts, null, 2) + "\n");
      results.push({ check: check.id, state: passed ? "passed" : "failed", log });
      console.log(`${check.id}: ${passed ? "passed" : "failed"} (${seconds.toFixed(0)} s)${passed ? "" : ` log: ${log}`}`);
      if (!passed) { process.exitCode = 1; break; }
    }
    writeFileSync(join(directory, "status.json"), JSON.stringify({ profile, tree, base, results }, null, 2) + "\n");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
