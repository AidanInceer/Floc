import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { git } from "./delivery/process.mjs";
import { publish } from "./delivery/publish.mjs";
import { release } from "./delivery/release.mjs";
import { recordReview } from "./delivery/review.mjs";
import { watchDir } from "./delivery/schedule.mjs";
import { targetFor } from "./workspace/worktrees.mjs";

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
  const dir = watchDir(root);
  const watchers = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8"))) : [];
  return { branch: git(root, "branch", "--show-current"), watchers: watchers.map(({ pr, branch, state, detail, at }) => ({ pr, branch, state, detail, at })) };
}

try {
  let result;
  if (action === "status") result = status();
  else if (action === "publish") {
    const messageFile = option("--message-file");
    if (!messageFile) throw new Error("publish needs --message-file <path> [--docs <page>...]");
    result = publish(root, { messageFile, docs: list("--docs") });
  } else if (action === "release") result = release(root, { approveSchema: option("--approve-schema") });
  else if (action === "review") {
    const branch = git(root, "branch", "--show-current");
    recordReview(root, `origin/${targetFor(branch)}`, JSON.parse(readFileSync(option("--evidence-file"), "utf8")));
    result = { state: "reviewed" };
  } else throw new Error("Expected status, publish, release or review.");
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
