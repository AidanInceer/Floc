// Why: eslint runs through a .cmd shim on Windows, and cmd.exe rejects a command
// line over 8191 characters — a big commit fails with "The command line is too long".
const BATCH = 30;

function batches(files) {
  const out = [];
  for (let i = 0; i < files.length; i += BATCH) out.push(files.slice(i, i + BATCH));
  return out;
}

/**
 * Why no tests here: a change to a shared file (schema.ts) pulled in nearly the
 * whole web suite and took minutes. Tests, types and coverage run in CI on the PR
 * (AGENTS.md, Guardrail gates).
 */
export default {
  "*.{ts,tsx}": (files) =>
    batches(files).map(
      (batch) =>
        `eslint --flag v10_config_lookup_from_file --max-warnings=0 --cache --cache-location .floc/eslintcache ${batch.map((f) => JSON.stringify(f)).join(" ")}`,
    ),
  "*.{ts,tsx,js,jsx,mjs,cjs}": "node scripts/check-comments.mjs --staged",
  "*": () => "node scripts/checks/secrets.mjs --staged",
};
