/**
 * Resolves the `@/…` path alias for scripts run under plain Node.
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

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

export function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

  const base = join(srcDir, specifier.slice(2));
  const target = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find(
    existsSync,
  );

  return nextResolve(target ? pathToFileURL(target).href : specifier, context);
}
