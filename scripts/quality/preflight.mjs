import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { git } from "./changes.mjs";

const message = "Run pnpm push:preflight <type> again; these exact files and release base must pass verify.";

function receiptFile(root) {
  return resolve(root, git(root, ["rev-parse", "--git-path", "floc-preflight.json"]).trim());
}

function tips(root) {
  return {
    main: git(root, ["rev-parse", "--verify", "origin/main^{commit}"]).trim(),
    develop: git(root, ["rev-parse", "--verify", "origin/develop^{commit}"]).trim(),
  };
}

export function workingTree(root) {
  const directory = mkdtempSync(join(tmpdir(), "floc-index-"));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: join(directory, "index") };
    git(root, ["read-tree", "HEAD"], { env });
    git(root, ["add", "-A", "--", "."], { env });
    return git(root, ["write-tree"], { env }).trim();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function invalidatePreflight(root) {
  rmSync(receiptFile(root), { force: true });
}

export function recordPreflight(root, tree) {
  writeFileSync(receiptFile(root), JSON.stringify({ tree, ...tips(root) }) + "\n");
}

export function assertPreflight(root, tree, remoteDevelop) {
  let receipt;
  try { receipt = JSON.parse(readFileSync(receiptFile(root), "utf8")); }
  catch { throw new Error("No successful preflight. " + message); }
  const current = tips(root);
  if (receipt.tree !== tree || receipt.main !== current.main || receipt.develop !== current.develop
    || (remoteDevelop !== undefined && remoteDevelop !== receipt.develop)) {
    throw new Error("Preflight is stale or the staged/committed tree differs. " + message);
  }
}
