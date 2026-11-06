import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { git } from "../delivery/process.mjs";

const PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp_|github_pat_|sk_live_|rk_live_)[A-Za-z0-9_]{20,}/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /(?:TURSO_AUTH_TOKEN|SONAR_TOKEN|STRIPE_SECRET_KEY|GOOGLE_CLIENT_SECRET|BETTER_AUTH_SECRET|CRON_SECRET|RAILWAY_TOKEN)\s*[:=]\s*["']?(?!\$|process\.|"|'|dev-only|e2e-only|test-only)([A-Za-z0-9_./+-]{25,})/,
];

export const leaks = (text) => PATTERNS.some((pattern) => pattern.test(text));

const root = process.cwd();
const staged = process.argv.includes("--staged");
const files = staged
  ? git(root, "diff", "--cached", "--name-only", "--diff-filter=ACM", "-z").split("\0").filter(Boolean)
  : git(root, "ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean);

const found = files.filter((file) => {
  try {
    if (statSync(file).size > 2_000_000 || /\.(png|jpe?g|webp|gif|woff2?|pdf|ico)$/.test(file)) return false;
    return leaks(readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
});

// Why gitleaks only at commit: it is optional, and it is the only scan that sees a secret while it is still free to undo.
const gitleaks = staged && spawnSync("gitleaks", ["version"], { shell: true, stdio: "ignore" }).status === 0
  ? spawnSync("gitleaks", ["protect", "--staged", "--no-banner", "--redact"], { shell: true, stdio: "inherit" }).status
  : 0;

if (found.length || gitleaks) {
  console.error(`Possible credentials in: ${found.join(", ") || "the staged changes (see gitleaks above)"}`);
  process.exitCode = 1;
} else if (!staged) console.log(`No credential patterns in ${files.length} files.`);
