import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const corepackPnpm = join(dirname(process.execPath), "node_modules/corepack/dist/pnpm.js");

function run([name, ...args], cwd) {
  const pnpm = name === "pnpm" && existsSync(corepackPnpm);
  const [file, argv] = name === "node" ? [process.execPath, args] : pnpm ? [process.execPath, [corepackPnpm, ...args]] : [name, args];
  return new Promise((done) => {
    const child = spawn(file, argv, { cwd, windowsHide: true, shell: !pnpm && name !== "node" && process.platform === "win32" });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("close", (code) => done({ ok: code === 0, output }));
    child.on("error", (error) => done({ ok: false, output: error.message }));
  });
}

/** Runs independent checks side by side. One line each; a failure prints the end of its output. */
export async function runAll(tasks, cwd = process.cwd(), tail = 25) {
  const started = Date.now();
  const results = await Promise.all(tasks.map(async ([label, cmd]) => { const at = Date.now(); return { label, ...(await run(cmd, cwd)), seconds: (Date.now() - at) / 1000 }; }));
  for (const { label, ok, output, seconds } of results) {
    console.log(`${ok ? "ok  " : "FAIL"} ${label} (${seconds.toFixed(1)} s)`);
    if (!ok) console.log(output.trim().split(/\r?\n/).slice(-tail).map((line) => `     ${line}`).join("\n"));
  }
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  return results.every((r) => r.ok);
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()) {
  const scripts = process.argv.slice(2);
  if (!(await runAll(scripts.map((script) => [script, ["pnpm", "run", "--silent", script]])))) process.exitCode = 1;
}
