/**
 * Metro, taught where the monorepo is (ticket 289).
 *
 * Out of the box Metro looks only in the app's own `node_modules`, so
 * `@floc/core` and `@floc/api` — workspace links a level up — resolve to
 * nothing and the app dies at its first import. Both settings below answer
 * that: watch the repo root so a change in a package triggers a reload, and
 * search the root's `node_modules` for what pnpm put there.
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../..");
const rootModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  rootModules,
];

// A package hoisted to the repo root has no `node_modules` directory above it
// inside the repo, so Metro's walk up the tree finds nothing and bare imports
// from expo-router fail. Point the shared singletons at the one copy the
// hoisted layout keeps at the root.
config.resolver.extraNodeModules = {
  react: path.join(rootModules, "react"),
  "react-dom": path.join(rootModules, "react-dom"),
  "react-native": path.join(rootModules, "react-native"),
};

// The hoisted layout keeps exactly one copy of every package in the two roots
// above, so walking the tree up from a hoisted module finds nothing new and on
// Windows resolves past the repo. Search only the roots.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
