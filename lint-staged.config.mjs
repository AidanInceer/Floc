import { relative } from "node:path";

// Why: eslint runs as `node eslint.js`, not through the .cmd shim, so cmd.exe's 8191-character
// limit never applies and one start (about 3 s of config loading) takes a whole commit. The
// limit left is CreateProcess's 32767; stay well under it.
const MAX_CHARS = 24000;
const ESLINT = "node node_modules/eslint/bin/eslint.js --flag v10_config_lookup_from_file --max-warnings=0 --cache --cache-location .floc/eslintcache";

function batches(files) {
  if (!files.length) return [];
  const out = [[]];
  let size = 0;
  for (const file of files) {
    const quoted = JSON.stringify(file);
    if (size + quoted.length > MAX_CHARS && out.at(-1).length) {
      out.push([]);
      size = 0;
    }
    out.at(-1).push(quoted);
    size += quoted.length + 1;
  }
  return out;
}

/**
 * Why no tests here: a change to a shared file (schema.ts) pulled in nearly the
 * whole web suite and took minutes. Tests, types and coverage run in CI on the PR
 * (AGENTS.md, Guardrail gates).
 */
export default {
  "*.{ts,tsx}": (files) => batches(files.filter((file) =>
    !relative(process.cwd(), file).replaceAll("\\", "/").startsWith("floc/wireframe/"),
  )).map((batch) => `${ESLINT} ${batch.join(" ")}`),
  "*.{ts,tsx,js,jsx,mjs,cjs}": "node scripts/check-comments.mjs --staged",
  "*": () => "node scripts/checks/secrets.mjs --staged",
};
