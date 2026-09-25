// Why: eslint runs through a .cmd shim on Windows, and cmd.exe rejects a command
// line over 8191 characters — a big commit fails with "The command line is too long".
const BATCH = 30;

function batches(files) {
  const out = [];
  for (let i = 0; i < files.length; i += BATCH) out.push(files.slice(i, i + BATCH));
  return out;
}

export default {
  "*.{ts,tsx}": (files) =>
    batches(files).map(
      (batch) =>
        `eslint --flag v10_config_lookup_from_file --max-warnings=0 ${batch.map((f) => JSON.stringify(f)).join(" ")}`,
    ),
  "*.{ts,tsx,js,jsx,mjs,cjs}": "node scripts/check-comments.mjs --staged",
  "*": "node scripts/check-staged-secrets.mjs",
};
