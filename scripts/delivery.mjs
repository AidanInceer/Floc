import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { git } from "./delivery/process.mjs";
import { publish } from "./delivery/publish.mjs";
import { finish } from "./delivery/finish.mjs";
import { release } from "./delivery/release.mjs";
import { recordReview } from "./delivery/review.mjs";
import { pullRequest } from "./delivery/github.mjs";
import { claimDocs } from "./delivery/docs.mjs";
import { mainCheckout, targetFor } from "./workspace/worktrees.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [action = "status", ...args] = process.argv.slice(2);
const option = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const list = (flag) => {
  const at = args.indexOf(flag);
  if (at < 0) return [];
  const end = args.findIndex((arg, i) => i > at && arg.startsWith("--"));
  return args.slice(at + 1, end < 0 ? undefined : end);
};

function status() {
  const branch = git(root, "branch", "--show-current");
  const pr = branch ? pullRequest(root, branch, "all") : null;
  return { branch, pr: pr && { number: pr.number, url: pr.url, state: pr.state }, worktrees: "pnpm workspace:list" };
}

try {
  let result;
  if (action === "status") result = status();
  else if (action === "publish") {
    const messageFile = option("--message-file");
    if (!messageFile) throw new Error("publish needs --message-file <path>");
    result = publish(root, { messageFile, hold: args.includes("--hold") });
  } else if (action === "finish") {
    const pr = option("--pr");
    if (!pr) throw new Error("finish needs --pr <number> [--docs <page>...]");
    result = await finish(root, { pr, docs: list("--docs") });
  } else if (action === "release") result = release(root, { approveSchema: option("--approve-schema") });
  else if (action === "review") {
    const branch = git(root, "branch", "--show-current");
    recordReview(root, `origin/${targetFor(branch)}`, JSON.parse(readFileSync(option("--evidence-file"), "utf8")));
    result = { state: "reviewed" };
  } else if (action === "claim") {
    const pages = list("--docs");
    if (!pages.length) throw new Error("claim needs --docs <page>...");
    result = claimDocs(mainCheckout(root), git(root, "branch", "--show-current"), pages);
  } else throw new Error("Expected status, publish, finish, release, review or claim.");
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
