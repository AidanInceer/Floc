import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectChanges } from "./changes.mjs";
import { analysisConfig } from "./config.mjs";
import { checkCoverage } from "./coverage.mjs";
import { lintSources } from "./lint.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// Why: CI runs the lint half before the tests finish and the coverage half after them; no argument runs both.
const mode = process.argv[2] ?? "all";

async function lint(changes, config) {
  const files = [...changes.keys()].filter(config.source);
  const issues = await lintSources(root, files, changes, config.ignored);
  for (const issue of issues.slice(0, 80)) {
    console.error(relative(root, issue.file) + ":" + issue.line + " " + (issue.ruleId ?? "parser") + " " + issue.message);
  }
  console.log("Local analysis: " + issues.length + " finding(s) across " + files.length + " release files.");
  return issues.length === 0;
}

function coverageOk(changes) {
  const coverage = checkCoverage(root, changes);
  console.log(coverage.missing.length
    ? "Release changed-code coverage: incomplete; " + coverage.missing.length + " source file(s) missing from LCOV."
    : "Release changed-code coverage: " + coverage.percent.toFixed(1) + "% (minimum 80%).");
  for (const file of coverage.missing) console.error("Missing LCOV source: " + file);
  for (const file of coverage.files.filter((file) => file.covered / file.total < 0.8).slice(0, 30)) {
    console.error(file.file + ": " + file.covered + "/" + file.total + " changed lines/conditions covered");
  }
  return coverage.ok;
}

try {
  const changes = collectChanges(root);
  const config = analysisConfig(root);
  const results = [];
  if (mode !== "coverage") results.push(await lint(changes, config));
  if (mode !== "lint") results.push(coverageOk(changes));
  console.log("Local checks supplement SonarCloud; cloud-only taint analysis and duplication remain release gates.");
  if (!results.every(Boolean)) process.exitCode = 1;
} catch (error) {
  console.error("Local quality check failed: " + error.message);
  process.exitCode = 1;
}
