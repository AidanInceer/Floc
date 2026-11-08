// Why: eslint runs through a .cmd shim on Windows, and cmd.exe rejects a command
// line over 8191 characters — a big commit fails with "The command line is too long".
const BATCH = 30;

function batches(files) {
  const out = [];
  for (let i = 0; i < files.length; i += BATCH) out.push(files.slice(i, i + BATCH));
  return out;
}

const PACKAGE = /[\\/](floc[\\/](?:apps|packages)[\\/][^\\/]+|floc[\\/]marketing)[\\/]/;

/** Staged source files grouped by the workspace package that owns them. */
export function byPackage(files) {
  const groups = new Map();
  for (const file of files) {
    const dir = file.match(PACKAGE)?.[1]?.replaceAll("\\", "/");
    if (!dir) continue;
    groups.set(dir, [...(groups.get(dir) ?? []), file]);
  }
  return groups;
}

/**
 * Why related tests only: the commit gate stays under a minute. The full
 * suites, types and coverage run in CI on the PR (AGENTS.md, Guardrail gates).
 */
export function relatedTests(files) {
  return [...byPackage(files)].flatMap(([dir, owned]) =>
    batches(owned).map((batch) => `pnpm --dir ${dir} exec vitest related --run --passWithNoTests ${batch.map((f) => JSON.stringify(f)).join(" ")}`),
  );
}

export default {
  "*.{ts,tsx}": (files) => [
    ...batches(files).map(
      (batch) =>
        `eslint --flag v10_config_lookup_from_file --max-warnings=0 --cache --cache-location .floc/eslintcache ${batch.map((f) => JSON.stringify(f)).join(" ")}`,
    ),
    ...relatedTests(files),
  ],
  "*.{ts,tsx,js,jsx,mjs,cjs}": "node scripts/check-comments.mjs --staged",
  "*": () => "node scripts/checks/secrets.mjs --staged",
};
