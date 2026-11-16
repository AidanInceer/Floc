import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");
const coreDir = join(here, "..", "..", "..", "packages", "floc-core", "src");

const EXTENSIONS = [".ts", ".tsx", "/index.ts"];

function firstThatExists(base) {
  const isFile = (path) => existsSync(path) && statSync(path).isFile();
  return [base, ...EXTENSIONS.map((ext) => `${base}${ext}`)].find(isFile);
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    const from = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : here;
    const target = firstThatExists(join(from, specifier));
    if (target) return nextResolve(pathToFileURL(target).href, context);
  }

  const root = specifier.startsWith("@/")
    ? [srcDir, specifier.slice(2)]
    : specifier.startsWith("@floc/core/")
      ? [coreDir, specifier.slice("@floc/core/".length)]
      : null;
  if (!root) return nextResolve(specifier, context);

  const target = firstThatExists(join(root[0], root[1]));

  return nextResolve(target ? pathToFileURL(target).href : specifier, context);
}
