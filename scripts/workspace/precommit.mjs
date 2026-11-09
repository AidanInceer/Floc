import { runAll } from "../checks/parallel.mjs";

const SOURCE = /\.(?:[cm]?js|jsx|tsx?)$/;
const WEB = /^floc\/apps\/web\/(?!node_modules\/).*\.(?:[cm]?js|jsx|tsx?|json)$/;

/**
 * Why side by side: ESLint's ~3 s of config loading, the repo rules and the CI quality lint
 * each cost seconds alone and need nothing from one another. Why these two extra checks: they
 * were most of the red PR runs a commit could have caught (quality lint, knip unused exports).
 */
export function planPreCommit(staged) {
  const plan = [
    ["repo rules", ["node", "scripts/checks/repo.mjs"]],
    ["staged files", ["node", "node_modules/lint-staged/bin/lint-staged.js"]],
  ];
  if (staged.some((file) => SOURCE.test(file))) plan.push(["quality lint", ["node", "scripts/quality/staged.mjs"]]);
  if (staged.some((file) => WEB.test(file))) plan.push(["dead code", ["node", "node_modules/knip/bin/knip.js", "--directory", "floc/apps/web"]]);
  return plan;
}

export function runPreCommit(root, staged) {
  return runAll(planPreCommit(staged), root, 200);
}
