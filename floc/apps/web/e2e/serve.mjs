// A fresh, seeded database, then `next start` over the last build, on 3100.
import { execSync, spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";

import { DATA_DIR, WEB_DIR, e2eEnv } from "./env.mjs";

const port = Number(process.argv[2] ?? 3100);
const env = { ...process.env, ...e2eEnv(port) };
const run = (command) => execSync(command, { cwd: WEB_DIR, env, stdio: "inherit" });

rmSync(DATA_DIR, { recursive: true, force: true });
mkdirSync(DATA_DIR, { recursive: true });
run("pnpm exec drizzle-kit migrate");
run(
  "node --experimental-strip-types --import ./scripts/alias-loader-register.mjs src/db/seed/index.ts",
);

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const next = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  cwd: WEB_DIR,
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code) => process.exit(code ?? 1));
