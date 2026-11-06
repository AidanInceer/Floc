import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

export const digest = (value) => createHash("sha256").update(value).digest("hex");
export function reusable(receipt, fingerprint, check) {
  return !check.fresh && receipt?.fingerprint === fingerprint
    && Date.now() - Date.parse(receipt.finishedAt) < 24 * 60 * 60 * 1000
    && receipt.artifacts.every((path) => existsSync(path)
      && (!receipt.artifactHashes || digest(readFileSync(path)) === receipt.artifactHashes[path]));
}
