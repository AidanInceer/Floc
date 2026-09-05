/**
 * Metro, taught where the monorepo is (ticket 289).
 *
 * Out of the box Metro looks only in the app's own `node_modules`, so
 * `@floc/core` and `@floc/api` — workspace links a level up — resolve to
 * nothing and the app dies at its first import. Both settings below answer
 * that: watch the repo root so a change in a package triggers a reload, and
 * search the root's `node_modules` for what pnpm put there.
 *
 * `disableHierarchicalLookup` stays off deliberately: pnpm's nested layout
 * needs the walk up the tree to find peer copies.
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
