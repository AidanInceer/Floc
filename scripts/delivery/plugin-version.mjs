import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { git } from "./process.mjs";
import { syncPlugin } from "../sync-floc-plugin.mjs";

const MANIFEST = "plugins/floc/.claude-plugin/plugin.json";

const greater = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

/** The version a branch that changed the plugin should carry: one minor step past the target's, unless it is already past it. */
export function nextPluginVersion(branchVersion, targetVersion) {
  if (greater(branchVersion, targetVersion)) return null;
  const [major, minor] = targetVersion.split(".").map(Number);
  return `${major}.${minor + 1}.0`;
}

/**
 * Why at publish: parallel sessions each bumped the version by hand and their PRs
 * conflicted on it. Publish has just merged the target in, so it knows the latest number.
 */
export function bumpPlugin(root, target) {
  if (!git(root, "diff", "--name-only", `origin/${target}...HEAD`, "--", "plugins/floc")) return null;
  const versionOf = (text) => JSON.parse(text).version;
  const next = nextPluginVersion(versionOf(readFileSync(join(root, MANIFEST), "utf8")), versionOf(git(root, "show", `origin/${target}:${MANIFEST}`)));
  if (!next) return null;
  const path = join(root, MANIFEST);
  const text = readFileSync(path, "utf8");
  writeFileSync(path, text.replace(/"version": "[^"]+"/, `"version": "${next}"`));
  syncPlugin(root);
  git(root, "add", "-A", "--", "plugins/floc", ".agents/plugins");
  git(root, "commit", "-m", `#no-ticket: chore: floc plugin ${next}`);
  return next;
}
