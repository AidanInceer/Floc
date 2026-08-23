#!/usr/bin/env bash
#
# Everything CI will run, run here first.
#
# This mirrors the five jobs in .github/workflows/{ci,security}.yml. When a job
# changes there, change it here in the same commit — a local gate that has
# drifted from CI is worse than no local gate, because it buys false confidence.
#
#   ci.yml       verify      → lint · typecheck · test · build   (via turbo)
#   ci.yml       fitness     → layers · dead code · tokens · contrast · bundle
#   ci.yml       migrations  → schema changes ship with a migration
#   ci.yml       wireframes  → wireframes stay self-contained
#   security.yml audit       → pnpm audit --audit-level=high
#   security.yml secrets     → gitleaks (skipped when not installed)
#
# Run it by hand any time:   pnpm verify
# It also runs from .githooks/pre-push — see that file for how it is wired.
#
# Not `set -e`: every check runs even after one fails, so a single run tells
# you everything that is wrong rather than only the first thing.
set -uo pipefail

cd "$(dirname "$0")/.."

fail=0
declare -a FAILED=()

# ---------------------------------------------------------------- plumbing

if [ -t 1 ]; then
  DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; OFF=$'\033[0m'
else
  DIM=''; RED=''; GREEN=''; YELLOW=''; OFF=''
fi

step() { printf '\n%s──%s %s\n' "$DIM" "$OFF" "$1"; }
ok()   { printf '%s  ✓%s %s\n' "$GREEN" "$OFF" "$1"; }
bad()  { printf '%s  ✗%s %s\n' "$RED" "$OFF" "$1"; fail=1; FAILED+=("$1"); }
skip() { printf '%s  ~%s %s\n' "$YELLOW" "$OFF" "$1"; }

# ------------------------------------------------------- node version

# A local Node newer than CI hides failures that only CI sees: 0.47.0 went red
# because dependency-cruiser needs >=22 and the runner was on 20.
step "Node is at least the version CI runs"
node_major=$(node -p "process.versions.node.split('.')[0]")
ci_major=$(grep -m1 -oE 'node-version: [0-9]+' .github/workflows/ci.yml | grep -oE '[0-9]+')
if [ "$node_major" -lt "$ci_major" ]; then
  bad "node $node_major is older than CI's $ci_major"
else
  ok "node $node_major, CI runs $ci_major"
fi

# --------------------------------------------------- ci.yml :: verify

# Turbo fans this out across the workspace exactly as CI does. CI additionally
# filters to packages affected by the diff; locally we just run all of them,
# because with one venture that is the same set and the filter is the part most
# likely to drift.
step "Lint · typecheck · test · build"
for task in lint typecheck test build; do
  if pnpm "$task" >/tmp/verify-$task.log 2>&1; then
    ok "$task"
  else
    bad "$task"
    tail -30 "/tmp/verify-$task.log"
  fi
done

# --------------------------------------------------- ci.yml :: fitness

# The structural checks (#212): layering, dead code, the globals.css token
# rules, WCAG contrast on every token pair, and the bundle budget. Needs the
# build above, which the turbo task depends on.
step "Architecture · dead code · tokens · contrast · bundle"
if pnpm fitness >/tmp/verify-fitness.log 2>&1; then
  ok "the codebase is not getting worse"
else
  bad "a fitness check failed"
  tail -40 /tmp/verify-fitness.log
fi

# ----------------------------------------------- ci.yml :: migrations

# `git status --porcelain`, not `git diff`: a missing migration shows up as a
# brand new *untracked* .sql file, which `git diff` does not report at all.
step "Schema changes ship with a migration"
if pnpm --filter waypoint-web db:generate >/tmp/verify-drizzle.log 2>&1; then
  drift=$(git status --porcelain -- ventures/waypoint/apps/web/drizzle)
  if [ -n "$drift" ]; then
    bad "a schema change has no migration"
    echo "$drift"
    echo "     fix: pnpm --filter waypoint-web db:generate, then commit ventures/waypoint/apps/web/drizzle/"
  else
    ok "migrations are in step with the schema"
  fi
else
  bad "db:generate failed"
  tail -20 /tmp/verify-drizzle.log
fi

# ----------------------------------------------- ci.yml :: wireframes

# Wireframes are plain HTML with no build step, so this just proves they stay
# self-contained — no external requests — which the Artifact CSP and our own
# offline-first convention both require. There are none right now (ticket 208
# deleted them); the check stays so the next one is born correct.
step "Wireframes stay self-contained"
shopt -s nullglob
files=(ventures/*/wireframe/*.html)
if [ ${#files[@]} -eq 0 ]; then
  ok "no wireframes — nothing to check"
else
  wf=0
  for f in "${files[@]}"; do
    if grep -nEi '(src|href)=["'"'"']https?://' "$f"; then
      echo "     $f references an external asset; inline it instead"
      wf=1
    fi
    if grep -nEi '<!doctype|<html[ >]|<body[ >]' "$f"; then
      echo "     $f should start at <title>, with no document wrapper"
      wf=1
    fi
  done
  [ "$wf" -eq 0 ] && ok "${#files[@]} wireframe(s) self-contained" || bad "wireframes reference external assets"
fi

# ------------------------------------------ security.yml :: audit

step "Known vulnerabilities"
if pnpm audit --audit-level=high >/tmp/verify-audit.log 2>&1; then
  ok "no high or critical advisories"
else
  bad "pnpm audit found a high/critical advisory"
  tail -30 /tmp/verify-audit.log
fi

# ----------------------------------------- security.yml :: secrets

# CI runs gitleaks over the FULL history (a secret removed in a later commit is
# still leaked). Locally that is slow and mostly re-checks history you did not
# touch, so this scans the working tree and staged changes instead — which is
# where a secret you are about to push actually is. CI remains the backstop.
step "Secret scan"
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks detect --no-banner --redact >/tmp/verify-gitleaks.log 2>&1; then
    ok "no secrets found"
  else
    bad "gitleaks found a secret"
    tail -30 /tmp/verify-gitleaks.log
  fi
else
  skip "gitleaks not installed — CI still scans. Install: winget install gitleaks"
fi

# ------------------------------------------------------------------ done

echo
if [ "$fail" -eq 0 ]; then
  printf '%s✓ everything CI checks passes here.%s\n' "$GREEN" "$OFF"
else
  printf '%s✗ %d check(s) failed:%s\n' "$RED" "${#FAILED[@]}" "$OFF"
  for f in "${FAILED[@]}"; do printf '    %s\n' "$f"; done
fi
exit $fail
