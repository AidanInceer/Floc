import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { digest } from "../checks/receipts.mjs";
import { git } from "./process.mjs";

const UI = /^floc\/(?!wireframe\/).*\.(tsx|css)$/;
const RULES = ".claude/rules/design.md";

/** A review covers one exact UI diff plus the design card it was judged against. */
export function reviewIdentity(root, base) {
  const changed = git(root, "diff", "--name-only", base, "--").split("\n")
    .concat(git(root, "ls-files", "--others", "--exclude-standard").split("\n"))
    .filter((p) => UI.test(p));
  if (!changed.length) return { required: false };
  const diff = git(root, "diff", "--unified=0", base, "--", ...new Set(changed));
  const untracked = changed.filter((p) => existsSync(join(root, p)) && !diff.includes(`b/${p}`)).map((p) => p + readFileSync(join(root, p), "utf8"));
  return { required: true, fingerprint: digest([changedLines(diff), ...untracked, readFileSync(join(root, RULES), "utf8")].join("\n")) };
}

/** Why: merging develop moves line numbers and context, not the change reviewed, so only the +/- lines count. */
export function changedLines(diff) {
  return diff.split("\n").filter((line) => /^(diff --git|[+-])/.test(line) && !/^(\+\+\+|---) /.test(line)).join("\n");
}

const recordFile = (root) => join(root, ".floc/design-review.json");

export function requireReview(root, base) {
  const identity = reviewIdentity(root, base);
  if (!identity.required) return;
  const file = recordFile(root);
  const review = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  if (!review || review.fingerprint !== identity.fingerprint) {
    throw new Error("This UI diff has no design review. Run the floc:design-review agent, then pnpm delivery review --evidence-file <json>.");
  }
}

export function recordReview(root, base, evidence) {
  if (!evidence.reviewer || !Array.isArray(evidence.findings) || !Array.isArray(evidence.screenshots) || !evidence.screenshots.length
    || !Array.isArray(evidence.unverified)) throw new Error("Review evidence needs reviewer, findings, screenshot paths and an unverified list.");
  if (evidence.findings.some((f) => f.blocking)) throw new Error("Fix the blocking findings, then review again.");
  for (const path of evidence.screenshots) if (!existsSync(path)) throw new Error(`Screenshot not found: ${path}`);
  mkdirSync(join(root, ".floc"), { recursive: true });
  writeFileSync(recordFile(root), JSON.stringify({ ...evidence, ...reviewIdentity(root, base), at: new Date().toISOString() }, null, 2) + "\n");
}
