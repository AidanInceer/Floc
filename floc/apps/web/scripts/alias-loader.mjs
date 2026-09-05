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
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");
// The workspace package's own source, not the node_modules symlink: Node's type
// stripping refuses TypeScript reached through a dependency (#286).
const coreDir = join(here, "..", "..", "..", "packages", "floc-core", "src");

export function resolve(specifier, context, nextResolve) {
  const root = specifier.startsWith("@/")
    ? [srcDir, specifier.slice(2)]
    : specifier.startsWith("@floc/core/")
      ? [coreDir, specifier.slice("@floc/core/".length)]
      : null;
  if (!root) return nextResolve(specifier, context);

  const base = join(root[0], root[1]);
  const target = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find(
    existsSync,
  );

  return nextResolve(target ? pathToFileURL(target).href : specifier, context);
}
