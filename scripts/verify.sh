#!/usr/bin/env bash
#
# Everything CI will run, run here first.
#
# This mirrors the five jobs in .github/workflows/{ci,security}.yml. When a job
# changes there, change it here in the same commit — a local gate that has
# drifted from CI is worse than no local gate, because it buys false confidence.
#
#   ci.yml       verify      → lint · typecheck · test · build   (via turbo)
#   ci.yml       sonarqube   → coverage + SonarCloud quality gate (PRs + main)
#   ci.yml       e2e-web     → Playwright over the build, on its own database
#   ci.yml       fitness     → layers · dead code · tokens · contrast · bundle
#   ci.yml       migrations  → schema changes ship with a migration
#   ci.yml       wireframes  → wireframes stay self-contained
#   ci.yml       parity      → the web/app gap is declared, not forgotten
#   ci.yml       mobile      → Expo bundles for Android and iOS
#
# Why: e2e-web, wireframes and the mobile jobs are paused in CI (`if: false`) to
# keep the Actions bill down. They still run here, so verify is now the only gate
# for them.
#
# One CI job is deliberately NOT mirrored: `mobile-android`, the native gradle
# compile. It takes twenty minutes and wants a JDK 17, which is too much to ask
# of a gate meant to be run before every push — and it is advisory in CI too.
# The Maestro flows run nowhere automatically: `pnpm --filter floc-mobile maestro`.
#   security.yml audit       → pnpm audit --audit-level=high
#   security.yml secrets     → gitleaks (skipped when not installed)
#
# Run it by hand:   pnpm verify
# Nothing runs it for you — the pre-push hook was removed deliberately. CI is
# the gate that blocks; this is the way to hear about it before pushing.
# SonarCloud is intentionally not run here: it needs the CI token and its
# result is reported by the GitHub job after this local gate. CI skips direct
# develop pushes because SonarQube Cloud Free supports main and pull requests,
# not non-main branch analysis.
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
#
# Four packages now, not one (#287, #289): floc-web, floc-mobile, @floc/core
# and @floc/api. Adding a package needs no edit here or in ci.yml — both go
# through turbo, which reads pnpm-workspace.yaml. `floc-mobile` has no build
# task on purpose; a phone bundle is EAS's job, not CI's (see
# floc/apps/mobile/SHIPPING.md).
#
# The build goes to `.next-verify`, not the `.next` a running `next dev` owns,
# so the dev servers can stay up through verify. CI builds to `.next` as usual.
export FLOC_NEXT_DIST_DIR=.next-verify

# One turbo call runs lint, typecheck and test side by side. Build is a second
# call: typecheck reads `.next-verify/types`, which a parallel build rewrites.
step "Lint · typecheck · test · build"
if pnpm turbo run lint typecheck test --continue >/tmp/verify-checks.log 2>&1; then
  for task in lint typecheck test; do ok "$task"; done
else
  failed_line=$(grep -E '^\s*Failed:' /tmp/verify-checks.log || true)
  for task in lint typecheck test; do
    if echo "$failed_line" | grep -qE "#$task\b"; then bad "$task"; else ok "$task"; fi
  done
  [ -z "$failed_line" ] && bad "turbo (lint · typecheck · test)"
  tail -40 /tmp/verify-checks.log
fi
if pnpm build >/tmp/verify-build.log 2>&1; then
  ok "build"
else
  bad "build"
  tail -30 /tmp/verify-build.log
fi

# --------------------------------------------------- ci.yml :: e2e-web

# Over the build above, on port 3100 and `.e2e/data`, so the dev server and
# local.db are untouched.
step "The web app works end to end"
if pnpm --filter floc-web e2e >/tmp/verify-e2e.log 2>&1; then
  ok "$(grep -E '[0-9]+ passed' /tmp/verify-e2e.log | tail -1 | xargs)"
else
  bad "a Playwright test failed"
  grep -vE '^\[WebServer\]' /tmp/verify-e2e.log | tail -40
fi

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
# Why: compared with the state before generating, so a migration written in this
# slice but not yet committed is not mistaken for a missing one.
step "Schema changes ship with a migration"
before=$(git status --porcelain -- floc/apps/web/drizzle)
if pnpm --filter floc-web db:generate >/tmp/verify-drizzle.log 2>&1; then
  drift=$(git status --porcelain -- floc/apps/web/drizzle)
  if [ "$drift" != "$before" ]; then
    bad "a schema change has no migration"
    echo "$drift"
    echo "     fix: pnpm --filter floc-web db:generate, then commit floc/apps/web/drizzle/"
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
files=(floc/wireframe/*.html)
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

# -------------------------------------------------- ci.yml :: parity

# What the phone app has and has not caught up on, asserted rather than
# remembered (see floc/packages/floc-api/src/parity.ts). Its own job in CI, not
# a turbo fitness task: turbo's affected-filter builds a changed package plus
# its *dependents*, and a mobile-only change has none — which is the change
# most likely to move parity.
step "The web/app gap is declared, not forgotten"
if pnpm parity >/tmp/verify-parity.log 2>&1; then
  ok "$(tail -1 /tmp/verify-parity.log)"
else
  bad "parity.json disagrees with the code"
  cat /tmp/verify-parity.log
fi

# --------------------------------------------------- ci.yml :: mobile

# Metro over the phone app, once per platform. The `verify` step above never
# builds it — floc-mobile has no `build` script, so turbo has nothing to run —
# which left a broken import on a mobile-only screen invisible until the app
# was opened. A bundle is JavaScript, so the iOS one builds on Windows fine.
#
# It always runs. The first cut skipped when nothing under the app had changed
# since HEAD, which meant it skipped the moment the work was committed — a gate
# that goes quiet exactly when you are about to push is not a gate. CI decides
# the same question against the previous commit, which is a thing CI can see
# and a pre-push script cannot.
step "The phone app bundles"
# Outside the repo: Metro watches the whole tree and dies when a folder it
# watches is deleted, which is what cleaning up `dist` did.
bundle_dir=$(mktemp -d)
if (cd floc/apps/mobile && pnpm exec expo export --platform android --platform ios --output-dir "$bundle_dir" >/dev/null 2>&1); then
  ok "android and ios bundles built"
else
  bad "the phone app does not bundle"
fi
rm -rf "$bundle_dir"

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
