import { execSync, spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

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

const next = spawn(
  process.execPath,
  ["--experimental-strip-types", "--import", "./scripts/alias-loader-register.mjs", "server.ts"],
  { cwd: WEB_DIR, env: { ...env, PORT: String(port) }, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code) => process.exit(code ?? 1));
