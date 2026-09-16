/**
 * Resolves the `@/…` and `@floc/core/…` specifiers for scripts run under plain
 * Node.
 *
 * Next.js and Vitest both read the alias out of tsconfig; Node's own type
 * stripping does no path mapping at all, so `pnpm db:seed` broke the moment a
 * module it reaches — `db/schema.ts` — started importing `@/lib/currency`. The
 * seed used to work around this by importing relatively, which only holds until
 * the next file in the graph doesn't.
 *
 * A resolve hook instead of relative-import discipline: one place to fix, and
 * `src/` keeps saying `@/` throughout as the rest of the app does. Extensionless
 * specifiers get `.ts` appended, since that's how the codebase writes them.
 *
 * The same appending has to happen for plain relative imports too: `@floc/core`
 * writes `../text/text` internally, and Node resolves that literally and finds
 * nothing. Only extensionless ones are touched, so `./index.ts` still goes
 * straight through.
 */
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");
// The workspace package's own source, not the node_modules symlink: Node's type
// stripping refuses TypeScript reached through a dependency (#286).
const coreDir = join(here, "..", "..", "..", "packages", "floc-core", "src");

const EXTENSIONS = [".ts", ".tsx", "/index.ts"];

function firstThatExists(base) {
  const isFile = (path) => existsSync(path) && statSync(path).isFile();
  return [base, ...EXTENSIONS.map((ext) => `${base}${ext}`)].find(isFile);
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    const from = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : here;
    const target = firstThatExists(join(from, specifier));
    if (target) return nextResolve(pathToFileURL(target).href, context);
  }

  const root = specifier.startsWith("@/")
    ? [srcDir, specifier.slice(2)]
    : specifier.startsWith("@floc/core/")
      ? [coreDir, specifier.slice("@floc/core/".length)]
      : null;
  if (!root) return nextResolve(specifier, context);

  const target = firstThatExists(join(root[0], root[1]));

  return nextResolve(target ? pathToFileURL(target).href : specifier, context);
}
