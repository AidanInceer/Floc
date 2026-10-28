import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { parseArgs, parseEnv, styleText } from "node:util";

import { applyRotation, STEPS } from "../src/server/operations/secret-rotation/apply.ts";
import { updateEnvText } from "../src/server/operations/secret-rotation/local-env.ts";
import { readPlan } from "../src/server/operations/secret-rotation/plan.ts";
import { createRailway } from "../src/server/operations/secret-rotation/railway.ts";
import { createTurso } from "../src/server/operations/secret-rotation/turso.ts";

async function railwayLogin() {
  try {
    const { user } = JSON.parse(await readFile(join(homedir(), ".railway", "config.json"), "utf8"));
    const expiry = Number(user?.tokenExpiresAt);
    const expiresAt = expiry > 1e12 ? expiry : expiry * 1000;
    if (user?.accessToken && expiresAt > Date.now() + 120_000) return createRailway(user.accessToken);
  } catch { /* Why: no CLI login is a prerequisite message, not a crash. */ }
  throw new Error("No Railway login. Run `railway login` (or `railway whoami` to refresh it), then run this again.");
}

function ask(question) {
  return new Promise((done) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); done(answer.trim()); });
  });
}

const checkout = fileURLToPath(new URL("../../../../", import.meta.url));
const TEMPLATE = `# Floc secret rotation. Fill in, run --apply, then delete this file.
# Leave a line empty to skip that credential.
TURSO_API_TOKEN=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
`;

// Why: the file holds live secrets inside the checkout, so refuse it unless git ignores it.
function assertIgnored(path) {
  return new Promise((done, fail) => execFile("git", ["check-ignore", "-q", path], { cwd: checkout },
    (error) => error ? fail(new Error(`${path} is not ignored by git. Fix .gitignore before putting secrets in it.`)) : done()));
}

async function readValues(path) {
  await assertIgnored(path);
  try { return parseEnv(await readFile(path, "utf8")); } catch (error) {
    if (error?.code !== "ENOENT") throw new Error("Cannot read the values file.");
    await writeFile(path, TEMPLATE, { flag: "wx" });
    return null;
  }
}

const paint = (format, text) => styleText(format, text);
const out = (text = "") => process.stdout.write(`${text}\n`);
const row = (mark, name, note) => out(`  ${mark} ${name.padEnd(24)} ${paint("dim", note)}`);
let lineOpen = false;

function printPlan(plan, file, path) {
  out();
  out(`  ${paint("bold", "floc.")}  rotate production secrets`);
  out(paint("dim", `  ${"─".repeat(56)}`));
  out(`  ${paint("dim", "Target ")}  ${plan.target} / production`);
  out(`  ${paint("dim", "Values ")}  ${path}`);
  out();
  const on = paint("green", "●");
  const off = paint("dim", "○");
  row(on, "BETTER_AUTH_SECRET", "made here");
  row(on, "CRON_SECRET", plan.cronFollowsWeb ? "made here · floc-cron follows floc-web" : "made here · written to both services");
  if (plan.turso) row(file.TURSO_API_TOKEN ? on : off, "TURSO_AUTH_TOKEN", file.TURSO_API_TOKEN ? "minted with your Turso API token" : "TURSO_API_TOKEN empty · skipped");
  for (const name of plan.pasted) row(file[name] ? on : off, name, file[name] ? "from the values file" : "empty · skipped");
  if (plan.unused.length || plan.other.length) {
    out();
    for (const name of plan.unused) row(paint("yellow", "–"), name, "unused · delete it at its provider and in Railway");
    for (const name of plan.other) row(paint("yellow", "!"), name, "not handled · rotate by hand");
  }
  out();
}

function showProgress({ step, label, state, detail }) {
  const head = `  ${paint("dim", `[${step + 1}/${STEPS.length}]`)} ${label.padEnd(24)}`;
  if (state === "start") { process.stdout.write(head); lineOpen = true; }
  else if (state === "status") process.stdout.write(` ${paint("dim", detail)}`);
  else {
    if (!lineOpen) process.stdout.write(head);
    out(detail ? ` ${paint("dim", detail)}` : ` ${paint("green", "✓")}`);
    lineOpen = false;
  }
}

async function updateLocalEnv(file) {
  const target = join(checkout, "floc", "apps", "web", ".env");
  await assertIgnored(target);
  let text;
  try { text = await readFile(target, "utf8"); } catch {
    out(`  ${paint("dim", "–")} Local .env      ${paint("dim", "not found · skipped")}`);
    return;
  }
  const result = updateEnvText(text, file);
  if (result.changed.length) await writeFile(target, result.text);
  out(`  ${paint("green", "✓")} Local .env      ${paint("dim", result.changed.length ? `updated ${result.changed.join(", ")}` : "already up to date")}`);
}

async function main() {
  const { values } = parseArgs({ options: { apply: { type: "boolean" }, local: { type: "boolean" } } });
  const path = join(checkout, "floc-rotation.env");
  const file = await readValues(path);
  if (!file) {
    out(`\n  Made ${paint("bold", path)}\n  Fill it in, then run this again.\n`);
    return;
  }
  if (values.local) { out(); await updateLocalEnv(file); out(); return; }
  const railway = await railwayLogin();
  const plan = await readPlan(railway);
  printPlan(plan, file, path);
  if (!values.apply) { out(`  Read-only. Run again with ${paint("bold", "--apply")} to rotate.\n`); return; }

  const supplied = Object.fromEntries(plan.pasted.filter((name) => file[name]).map((name) => [name, file[name]]));
  if (plan.turso && file.TURSO_API_TOKEN) supplied.turso = createTurso(file.TURSO_API_TOKEN);
  out(paint("yellow", "  Everyone is signed out and calendar feed links change."));
  if (supplied.turso) out(paint("yellow", "  The site has no database from step 3 until step 4 ends."));
  out();
  if (await ask(`  Type ${paint("bold", "ROTATE")} to continue: `) !== "ROTATE") { out("  Stopped. Nothing changed.\n"); return; }
  out();
  const rotated = await applyRotation(supplied, { railway, progress: showProgress });
  out(`\n  ${paint("green", "✓ Done.")} Rotated ${rotated.join(", ")}\n`);
  await updateLocalEnv(file);
  out();
  out(paint("bold", "  Next"));
  const next = [
    `Delete the values file: Remove-Item "${path}"`,
    "Sign in with Google on floc.live, then disable the old Google secret",
    "Delete the Turso API token",
    "Check the next floc-cron run in Railway logs",
  ];
  next.forEach((item, index) => out(`  ${index + 1}. ${item}`));
  out();
}

main().catch((error) => {
  if (lineOpen) out(` ${paint("red", "✗")}`);
  out(`\n  ${paint("red", "✗ Stopped:")} ${error instanceof Error ? error.message : "unknown error"}`);
  out(paint("dim", "  Secrets and provider responses are not printed. Running again is safe.\n"));
  process.exitCode = 1;
});
