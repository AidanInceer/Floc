import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { command } from "../delivery/process.mjs";

const output = mkdtempSync(join(tmpdir(), "floc-mobile-check-"));
try {
  command("pnpm", ["--filter", "floc-mobile", "exec", "expo", "export", "--platform", "android", "--platform", "ios", "--output-dir", output], { stdio: "inherit" });
} finally { rmSync(output, { recursive: true, force: true }); }
