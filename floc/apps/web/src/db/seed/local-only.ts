import { isAbsolute, relative, resolve } from "node:path";

type Env = Record<string, string | undefined>;

export function assertLocalDatabase(env: Env = process.env): void {
  const url = env.TURSO_DATABASE_URL ?? "file:./local.db";
  if (env.NODE_ENV === "production" || !url.startsWith("file:")) {
    throw new Error(
      "Refusing: the dev seed only runs against a local file: database outside production.",
    );
  }
}

/**
 * Why two roots: the main checkout keeps uploads under the web app, and a task worktree keeps
 * them in its own `.floc/` at the repo root (`pnpm workspace:new`). Nothing else is ever cleared.
 */
export function assertClearableFilesDir(target: string, webDir: string): void {
  const roots = [webDir, resolve(webDir, "../../../.floc")];
  const inside = roots.some((root) => {
    const rel = relative(root, resolve(target));
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  });
  if (!inside) throw new Error(`Refusing to clear FLOC_FILES_DIR outside the web app: ${resolve(target)}`);
}
