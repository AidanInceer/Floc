// Why: times each click from pointerdown to the DOM answering, on the production build and its
// own seeded database, so rounds compare like for like. `remote` adds 150 ms to every request.
//   pnpm --filter floc-web perf:clicks -- --label r1 [--build] [--runs 7] [--only days]
import { execSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

import { e2eEnv, WEB_DIR } from "../e2e/env.mjs";
import { SCENARIOS } from "./scenarios.mjs";

const args = parseArgs(process.argv.slice(2));
const PORT = Number(args.port ?? 3190);
const BASE = `http://localhost:${PORT}`;
const RUNS = Number(args.runs ?? 7);
const DIST = ".next-verify";
const OUT_DIR = resolve(WEB_DIR, ".perf");
const PROFILES = [
  { name: "local", latency: 0 },
  { name: "remote", latency: 150 },
].filter((p) => !args.profile || p.name === args.profile);

function parseArgs(list) {
  const out = {};
  for (let i = 0; i < list.length; i++) {
    const key = list[i].replace(/^--/, "");
    const next = list[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else out[key] = list[++i];
  }
  return out;
}

function build() {
  execSync("pnpm exec next build", {
    cwd: WEB_DIR,
    env: { ...process.env, FLOC_NEXT_DIST_DIR: DIST },
    stdio: "inherit",
  });
}

async function startServer() {
  const server = spawn(process.execPath, ["e2e/serve.mjs", String(PORT)], {
    cwd: WEB_DIR,
    env: { ...process.env, ...e2eEnv(PORT), FLOC_NEXT_DIST_DIR: DIST },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Server exited:\n${log}`);
    try {
      const res = await fetch(`${BASE}/api/auth/get-session`);
      if (res.ok) return server;
    } catch {
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  stop(server);
  throw new Error(`Server did not start:\n${log}`);
}

// Why: serve.mjs spawns the server as its own child, and Windows kills only the parent.
function stop(server) {
  if (process.platform === "win32") execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
  else server.kill("SIGTERM");
}

/** Installed before every page script: the timer the scenarios read. */
function timerScript() {
  window.__click = { t0: 0, t1: 0, pred: null };
  const check = () => {
    const c = window.__click;
    if (!c.pred || !c.t0 || c.t1) return;
    try {
      if (c.pred()) c.t1 = performance.now();
    } catch {
    }
  };
  const loop = () => {
    check();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new MutationObserver(check).observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  addEventListener(
    "pointerdown",
    () => {
      const c = window.__click;
      if (c.pred && !c.t0) c.t0 = performance.now();
    },
    true,
  );
}

async function timeClick(page, target, done, arg = null) {
  const already = await page.evaluate(
    ([src, a]) => {
      const pred = new Function("arg", `return (${src})(arg);`).bind(null, a);
      window.__click = { ...window.__click, t0: 0, t1: 0, pred };
      return pred();
    },
    [done.toString(), arg],
  );
  if (already) throw new Error("done before the click — the scenario measures nothing");
  await target.click();
  await page.waitForFunction(() => window.__click.t1 > 0, null, { timeout: 20_000 });
  return page.evaluate(() => {
    const c = window.__click;
    c.pred = null;
    return c.t1 - c.t0;
  });
}

async function signIn(page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill("priya@a.seed.floc.test");
  await page.getByLabel("Password").fill("seed-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/trips$/);
}

async function tripId(page) {
  const href = await page.getByRole("link", { name: /Portugal, late summer/ }).first().getAttribute("href");
  return Number(href.match(/\/trip\/(\d+)/)[1]);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const p90 = (xs) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.ceil(xs.length * 0.9) - 1)];

async function runProfile(browser, profile, only) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(timerScript);
  const page = await context.newPage();
  await signIn(page);
  const trip = await tripId(page);
  await page.goto(`${BASE}/trip/${trip}/overview`);
  const skip = page.getByRole("dialog").getByRole("button", { name: "Skip" });
  if (await skip.waitFor({ timeout: 10_000 }).then(() => true, () => false)) {
    await skip.click();
    await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: profile.latency,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });

  const ctx = { page, base: BASE, trip, tag: profile.name, timeClick: (t, d, a) => timeClick(page, t, d, a) };
  const results = [];
  for (const scenario of SCENARIOS) {
    if (only && !scenario.id.includes(only)) continue;
    const samples = [];
    let failures = 0;
    let error = null;
    let fresh = true;
    // Why: one stuck click must not cost the whole scenario; it is counted, and the next sample starts clean.
    for (let i = 0; i <= RUNS && failures < 3; i++) {
      try {
        await scenario.setup?.(ctx, fresh ? 0 : i, i);
        fresh = false;
        const ms = await scenario.run(ctx, i);
        if (i > 0) samples.push(ms);
        await scenario.teardown?.(ctx, i);
      } catch (e) {
        failures++;
        fresh = true;
        error = String(e.message ?? e).split("\n")[0];
        mkdirSync(OUT_DIR, { recursive: true });
        const shot = resolve(OUT_DIR, `${args.label ?? "run"}-${profile.name}-${scenario.id}.png`);
        await page.screenshot({ path: shot }).catch(() => {});
      }
    }
    const row = {
      id: scenario.id,
      area: scenario.area,
      label: scenario.label,
      samples: samples.map((s) => Math.round(s * 10) / 10),
      median: samples.length ? Math.round(median(samples)) : null,
      p90: samples.length ? Math.round(p90(samples)) : null,
      failures,
      error,
    };
    results.push(row);
    console.log(
      `${profile.name.padEnd(6)} ${scenario.id.padEnd(28)} ${row.median === null ? "—" : `${row.median} ms`.padStart(8)}` +
        `${row.p90 === null ? "" : `  p90 ${row.p90} ms`}${error ? `  ${failures} failed: ${error}` : ""}`,
    );
  }
  await context.close();
  return results;
}

async function main() {
  if (args.build) build();
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const out = { label: args.label ?? "run", at: new Date().toISOString(), runs: RUNS, profiles: {} };
    for (const profile of PROFILES) {
      out.profiles[profile.name] = await runProfile(browser, profile, args.only);
    }
    mkdirSync(OUT_DIR, { recursive: true });
    const file = resolve(OUT_DIR, `${out.label}.json`);
    writeFileSync(file, JSON.stringify(out, null, 2));
    console.log(`\nWrote ${file}`);
  } finally {
    await browser.close();
    stop(server);
  }
}

await main();
