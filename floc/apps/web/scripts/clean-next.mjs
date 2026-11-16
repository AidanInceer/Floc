import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

for (const name of [".next", ".next-verify", ".e2e/next-dev"]) {
  const dir = fileURLToPath(new URL(`../${name}`, import.meta.url));
  rmSync(dir, { recursive: true, force: true });
  console.log(`removed ${dir}`);
}
