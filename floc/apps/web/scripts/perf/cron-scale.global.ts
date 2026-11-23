import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default function holdScaleDatabase() {
  const dir = mkdtempSync(join(tmpdir(), "floc-scale-"));
  process.env.FLOC_SCALE_DB = join(dir, "scale.db");
  return () => rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
