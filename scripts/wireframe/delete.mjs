// pnpm wireframe:delete <path> [...]   Deletes prototype files or folders, only inside floc/wireframe/ of the checkout it runs in.
// Why: closing a prototype round deletes the rejected options (floc:prototype), and the shell's own rm -r / Remove-Item -Recurse
// are denied everywhere; this one command is allowed because it cannot reach past floc/wireframe.
import { existsSync, rmSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const LEADING_DOT = new RegExp("^\\./");

export function wireframeTarget(root, arg) {
  const base = join(root, "floc", "wireframe");
  const spelled = arg.replaceAll("\\", "/").replace(LEADING_DOT, "");
  const target = isAbsolute(arg) ? resolve(arg) : resolve(spelled.startsWith("floc/wireframe") ? root : base, spelled);
  const inside = relative(base, target);
  if (!inside || inside.startsWith("..") || isAbsolute(inside) || inside.split(sep)[0] === "..") {
    throw new Error(`Only a path inside floc/wireframe can be deleted: ${arg}`);
  }
  return target;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const args = process.argv.slice(2);
  if (!args.length) throw new Error("Name what to delete, relative to floc/wireframe: pnpm wireframe:delete <path> [...]");
  const targets = args.map((arg) => wireframeTarget(root, arg));
  for (const target of targets) {
    if (!existsSync(target)) {
      console.log(`not there: ${relative(root, target)}`);
      continue;
    }
    rmSync(target, { recursive: true, force: true });
    console.log(`deleted: ${relative(root, target)}`);
  }
}
