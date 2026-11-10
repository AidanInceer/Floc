const EVERY = ["quick", "pr", "release"];
export const PROFILES = ["quick", "pr", "release", "coverage"];

// Why: order is fail-fast. The cheap checks that fail most often come first; tests, build and their follow-ups last.
export const checks = [
  { id: "tool-tests", profiles: EVERY, command: ["node", "scripts/checks/tool-tests.mjs"], scope: "tooling" },
  { id: "repository", profiles: EVERY, command: ["node", "scripts/checks/repo.mjs"] },
  { id: "secrets", profiles: EVERY, command: ["node", "scripts/checks/secrets.mjs"], fresh: true },
  { id: "lint", profiles: EVERY, command: ["pnpm", "turbo", "run", "lint"], affected: true, scope: "code" },
  { id: "quality-lint", profiles: ["pr", "release"], command: ["node", "scripts/quality/run.mjs", "lint"], scope: "code" },
  { id: "fitness-source", profiles: ["pr", "release"], command: ["pnpm", "--filter", "floc-web", "fitness:source"], scope: "code" },
  { id: "types", profiles: EVERY, command: ["pnpm", "turbo", "run", "typecheck"], affected: true, scope: "code" },
  { id: "migrations", profiles: ["pr", "release"], command: ["node", "scripts/checks/migrations.mjs"], scope: "code" },
  { id: "tests", profiles: [...EVERY, "coverage"], command: ["pnpm", "turbo", "run", "test", "--concurrency=2", "--", "--maxWorkers=2"], affected: true, scope: "code", coverage: true },
  { id: "quality-coverage", profiles: ["pr", "release"], command: ["node", "scripts/quality/run.mjs", "coverage"], scope: "code" },
  { id: "web-source", profiles: ["quick"], command: ["pnpm", "--filter", "floc-web", "fitness:source"], scope: "web" },
  { id: "build", profiles: ["pr", "release"], command: ["pnpm", "turbo", "run", "build"], scope: "code" },
  { id: "generated-types", profiles: ["pr", "release"], command: ["pnpm", "--filter", "floc-web", "typecheck"], scope: "code" },
  { id: "fitness-bundle", profiles: ["pr", "release"], command: ["pnpm", "--filter", "floc-web", "check:bundle"], scope: "code" },
  { id: "web-journeys", profiles: ["release"], command: ["pnpm", "--filter", "floc-web", "e2e"], scope: "code" },
  { id: "mobile-bundles", profiles: ["release"], command: ["node", "scripts/checks/mobile.mjs"], scope: "mobile" },
  { id: "audit", profiles: ["release"], command: ["pnpm", "audit", "--audit-level=high"], fresh: true },
];

export function scopeFor(paths) {
  return {
    code: paths.some((p) => !p.endsWith(".md") && !p.startsWith("floc/wireframe/")),
    tooling: paths.some((p) => /^(scripts\/|\.github\/|plugins\/|package\.json|pnpm-)/.test(p)),
    web: paths.some((p) => /^(floc\/apps\/web\/|floc\/packages\/|\.claude\/rules\/design\.md)/.test(p)),
    mobile: paths.some((p) => /^(floc\/(apps\/mobile|packages)\/|pnpm-lock\.yaml|package\.json)/.test(p)),
  };
}

export function selectedChecks(profile, paths, full = false) {
  if (!PROFILES.includes(profile)) throw new Error(`Check profile must be one of: ${PROFILES.join(", ")}.`);
  const scope = scopeFor(paths);
  return checks.filter((check) => check.profiles.includes(profile) && (full || profile === "coverage" || !check.scope || scope[check.scope]));
}

/** `--only a,b` keeps the listed checks in manifest order; an unknown id is a mistake, not a skip. */
export function onlyChecks(selected, wanted) {
  const unknown = wanted.filter((id) => !checks.some((c) => c.id === id));
  if (unknown.length) throw new Error(`Unknown check id: ${unknown.join(", ")}.`);
  return selected.filter((c) => wanted.includes(c.id));
}

/** Local runs reuse Turbo's cache; CI profiles need fresh coverage files. Quick and PR runs test only what the diff affects. */
export function commandFor(check, profile, base) {
  const args = [...check.command];
  const marker = args.indexOf("--") < 0 ? args.length : args.indexOf("--");
  const extra = [];
  if (check.coverage && profile !== "quick") extra.push("--force");
  if (check.affected && ["quick", "pr"].includes(profile)) extra.push(`--filter=...[${base}]`);
  // Why: generated-types type-checks floc-web after the build, with Next's route types; once is enough.
  if (check.id === "types" && ["pr", "release"].includes(profile)) extra.push("--filter=!floc-web");
  args.splice(marker, 0, ...extra);
  return args;
}
