import { runAll } from "../checks/parallel.mjs";

const SOURCE = /\.(?:[cm]?js|jsx|tsx?)$/;
const DOCS_INPUT = /^(floc\/apps\/web\/src\/db\/schema\.ts|scripts\/parity\/parity\.json|AGENTS\.md|learnings\.md|\.claude\/rules\/[^/]+\.md|scripts\/check-docs\.mjs)$/;
const WEB = /^floc\/apps\/web\/(?!node_modules\/).*\.(?:[cm]?js|jsx|tsx?|json)$/;
const SHARED = /^floc\/(?:apps\/mobile|packages\/[^/]+)\/(?!node_modules\/).*\.(?:[cm]?js|jsx|tsx?|json)$/;

export function planPreCommit(staged) {
  const plan = [
    ["repo rules", ["node", "scripts/checks/repo.mjs", "--without", "docs"]],
    ["staged files", ["node", "node_modules/lint-staged/bin/lint-staged.js"]],
  ];
  if (staged.some((file) => DOCS_INPUT.test(file))) plan.push(["docs", ["node", "scripts/check-docs.mjs"]]);
  if (staged.some((file) => SOURCE.test(file) && !file.startsWith("floc/wireframe/"))) plan.push(["quality lint", ["node", "scripts/quality/staged.mjs"]]);
  if (staged.some((file) => WEB.test(file))) plan.push(["dead code", ["node", "node_modules/knip/bin/knip.js", "--directory", "floc/apps/web"]]);
  if (staged.some((file) => WEB.test(file) || SHARED.test(file))) plan.push(["dead exports", ["node", "node_modules/knip/bin/knip.js", "--include", "files,exports"]]);
  return plan;
}

export function runPreCommit(root, staged) {
  return runAll(planPreCommit(staged), root, 200);
}
