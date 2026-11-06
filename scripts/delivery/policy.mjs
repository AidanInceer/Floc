import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { command } from "./process.mjs";
import { repository, requiredChecks } from "./github.mjs";

// Why: the Sync develop workflow pushes main back into develop with the Actions token, so only GitHub Actions may bypass.
const GITHUB_ACTIONS_APP = 15368;

export function ruleset(branch) {
  return {
    name: `Floc ${branch}`,
    target: "branch",
    enforcement: "active",
    conditions: { ref_name: { include: [`refs/heads/${branch}`], exclude: [] } },
    bypass_actors: [{ actor_id: GITHUB_ACTIONS_APP, actor_type: "Integration", bypass_mode: "always" }],
    rules: [
      { type: "deletion" },
      { type: "non_fast_forward" },
      { type: "pull_request", parameters: { required_approving_review_count: 0, dismiss_stale_reviews_on_push: false,
        require_code_owner_review: false, require_last_push_approval: false, required_review_thread_resolution: false, allowed_merge_methods: ["merge"] } },
      // Why not strict on develop: every merge would make each open PR run CI again. The full run after each merge catches combined breaks.
      { type: "required_status_checks", parameters: { strict_required_status_checks_policy: branch === "main",
        required_status_checks: requiredChecks[branch].map((context) => ({ context })) } },
    ],
  };
}

export const repoSettings = { allow_auto_merge: true, delete_branch_on_merge: true, allow_merge_commit: true };

function api(method, path, body) {
  const args = ["api", "--method", method, path];
  if (body) {
    mkdirSync(".floc", { recursive: true });
    const file = join(process.cwd(), ".floc", "policy-body.json");
    writeFileSync(file, JSON.stringify(body));
    args.push("--input", file);
  }
  return JSON.parse(command("gh", args) || "null");
}

export function applyPolicy() {
  api("PATCH", `repos/${repository}`, repoSettings);
  const existing = api("GET", `repos/${repository}/rulesets`);
  return ["develop", "main"].map((branch) => {
    const wanted = ruleset(branch);
    const found = existing.find((r) => r.name === wanted.name);
    const saved = found ? api("PUT", `repos/${repository}/rulesets/${found.id}`, wanted) : api("POST", `repos/${repository}/rulesets`, wanted);
    return { branch, id: saved.id };
  });
}

if (process.argv[1]?.endsWith("policy.mjs")) {
  try {
    console.log(JSON.stringify(process.argv.includes("--apply") ? { applied: applyPolicy() } : { applied: false, repoSettings, rulesets: ["develop", "main"].map(ruleset) }, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
