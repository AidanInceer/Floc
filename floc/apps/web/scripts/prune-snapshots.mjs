import { readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SNAPSHOT = /^\d+_snapshot\.json$/;

export function staleSnapshots(names) {
  return names.filter((name) => SNAPSHOT.test(name)).sort().slice(0, -1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const meta = join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle", "meta");
  for (const name of staleSnapshots(readdirSync(meta))) rmSync(join(meta, name));
}
