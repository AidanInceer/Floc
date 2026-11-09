import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectStaged } from "./changes.mjs";
import { analysisConfig } from "./config.mjs";
import { lintSources } from "./lint.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

try {
  const changes = collectStaged(root);
  const config = analysisConfig(root);
  const files = [...changes.keys()].filter(config.source);
  const issues = await lintSources(root, files, changes, config.ignored);
  for (const issue of issues.slice(0, 80)) {
    console.error(relative(root, issue.file) + ":" + issue.line + " " + (issue.ruleId ?? "parser") + " " + issue.message);
  }
  console.log("Quality lint: " + issues.length + " finding(s) across " + files.length + " staged source files.");
  if (issues.length) process.exitCode = 1;
} catch (error) {
  console.error("Quality lint failed: " + error.message);
  process.exitCode = 1;
}
