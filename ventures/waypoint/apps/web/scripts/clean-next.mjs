// OneDrive syncs while builds write, which leaves `.next` unreadable (EINVAL
// on readlink) and only deleting it cures that. The path is fixed here rather
// than taken as an argument, so the command cannot be pointed elsewhere.
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../.next", import.meta.url));
rmSync(dir, { recursive: true, force: true });
console.log(`removed ${dir}`);
