#!/usr/bin/env node
// node scripts/sonar-gate.mjs [branch]
// Why: the CI log only says "QUALITY GATE STATUS: FAILED". The failing
// conditions and the issues behind them live in SonarCloud's API, which is
// public for this project and needs no token (#403).
// Exit 0 gate passed · 1 gate failed (conditions and issues printed) · 2 no
// analysis for that branch yet.
const PROJECT = "AidanInceer_Floc";
const BASE = "https://sonarcloud.io/api";
const branch = process.argv[2] ?? "main";

async function get(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`SonarCloud ${path} → ${res.status}`);
  return res.json();
}

const { projectStatus } = await get(
  `qualitygates/project_status?projectKey=${PROJECT}&branch=${encodeURIComponent(branch)}`,
);

if (projectStatus.status === "NONE") {
  console.log(`No SonarCloud analysis for ${branch} yet.`);
  process.exit(2);
}

if (projectStatus.status === "OK") {
  console.log(`Sonar quality gate passed on ${branch}.`);
  process.exit(0);
}

console.log(`Sonar quality gate FAILED on ${branch}.\n`);
console.log("Conditions that failed:");
for (const c of projectStatus.conditions.filter((c) => c.status === "ERROR")) {
  console.log(`  ${c.metricKey}: ${c.actualValue} (threshold ${c.comparator} ${c.errorThreshold})`);
}

const { issues } = await get(
  `issues/search?componentKeys=${PROJECT}&branch=${encodeURIComponent(branch)}` +
    `&resolved=false&inNewCodePeriod=true&ps=100`,
);

console.log(`\nOpen issues in the new-code window (${issues.length}):`);
for (const i of issues) {
  const file = i.component.split(":").pop();
  console.log(`  [${i.severity}] ${i.rule}  ${file}:${i.line ?? "-"}\n      ${i.message}`);
}
console.log(`\nhttps://sonarcloud.io/dashboard?id=${PROJECT}&branch=${encodeURIComponent(branch)}`);
process.exit(1);
