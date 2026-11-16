const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");
const { FileStore } = require("metro-cache");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../..");
const rootModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  rootModules,
];

config.resolver.extraNodeModules = {
  react: path.join(rootModules, "react"),
  "react-dom": path.join(rootModules, "react-dom"),
  "react-native": path.join(rootModules, "react-native"),
};

config.resolver.disableHierarchicalLookup = true;

config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /[\\/]floc[\\/]apps[\\/](web[\\/](\.next(-verify)?|\.e2e|coverage)|mobile[\\/](dist|coverage))([\\/].*)?$/,
  /[\\/]floc[\\/]packages[\\/][^\\/]+[\\/]coverage([\\/].*)?$/,
];

const checkout = createHash("sha1").update(workspaceRoot).digest("hex").slice(0, 12);
config.cacheStores = [new FileStore({ root: path.join(os.tmpdir(), `metro-cache-${checkout}`) })];

const lib0Crypto = path.resolve(projectRoot, "shims/lib0-webcrypto.js");
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) =>
  moduleName === "lib0/webcrypto"
    ? { type: "sourceFile", filePath: lib0Crypto }
    : (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);

module.exports = config;
