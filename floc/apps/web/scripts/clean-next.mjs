// OneDrive syncs while builds write, which leaves `.next` unreadable (EINVAL
// on readlink) and only deleting it cures that. The paths are fixed here rather
// than taken as an argument, so the command cannot be pointed elsewhere.
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

// `.e2e/next-dev/types` is listed in tsconfig `include`; a deleted route leaves its
// generated types there and typecheck fails on a file that no longer exists.
for (const name of [".next", ".next-verify", ".e2e/next-dev"]) {
  const dir = fileURLToPath(new URL(`../${name}`, import.meta.url));
  rmSync(dir, { recursive: true, force: true });
  console.log(`removed ${dir}`);
}
