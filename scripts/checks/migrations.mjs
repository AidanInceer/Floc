import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { command } from "../delivery/process.mjs";

function fingerprint(dir) {
  const hash = createHash("sha256");
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    hash.update(entry.name).update(entry.isDirectory() ? fingerprint(path) : readFileSync(path));
  }
  return hash.digest("hex");
}
const before = fingerprint("floc/apps/web/drizzle");
command("pnpm", ["--filter", "floc-web", "db:generate"], { stdio: "inherit" });
if (before !== fingerprint("floc/apps/web/drizzle")) throw new Error("A schema change is missing its generated migration.");
