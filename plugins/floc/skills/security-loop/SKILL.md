---
name: security-loop
description: Score the Floc website's security with three blind reviewers (two Opus 5.5, one Sonnet 5.5), fix what they prove test-first, and review once more. Stops when all three score 9.0/10 or more, or after two rounds. Covers sign-in and sessions, trip access, data leaks, injection, files and mail, failure modes, config, billing, secrets and prompt injection. Local only, except a passive read of production headers and DNS; never pushes. Use when the user says /floc:security-loop, "security loop", "harden the site", or wants the site's security scored and raised.
disable-model-invocation: true
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# security-loop

Three reviewers score the site out of 10 and list every problem they can
prove. You check each problem, fix the real ones test-first, then start three
new reviewers. Stop when all three in one round score 9.0 or more, or after
two rounds.

The scores show where the site stands today. The attack tests that the fixes
leave in the suite stop a fixed hole from coming back. The scores do not.

Not this skill: one diff before merge → `/security-review`. A product review →
`/floc:audit`.

## Rules

- **Local only.** Reviews and fixes reach this worktree, its `local.db` and its
  own dev server ([AGENTS.md](AGENTS.md), "Real users — hard stop"). The only
  exception is step 2's passive read of production: public headers and DNS,
  no sign-in, no ids, no writes.
- **Fixes need a task worktree.** In the main checkout, run
  `pnpm workspace:new security-<yyyymmdd>` first.
- **Two rounds at most.** A round is three reviews and the fixes after them.
- **Ask Aidan first** before a data model change (`/floc:schema-change`), a
  change to an accepted ADR, a change to how sign-in, sessions, encryption or
  PII work, or a new dependency. Write the finding up, leave that fix, and carry
  on with the others.
- **Never weaken a check to raise a score.** No lowered limit, no muted rule, no
  skipped test. You never accept a risk; only an ADR or Aidan does.
- **Fixed for the whole loop:** the reviewer brief and the known list. Change
  neither between rounds.
- **Never push.** The loop ends `local, uncommitted`. Aidan decides on
  `/floc:push`.
- **Sub-agents with a model choice are required.** If the runtime has none
  (Codex), stop and say so: three reviews in one context are not blind.

## 1. Read the bar

- [Security and privacy](docs/engineering/security.html): the threat table,
  "Open gaps" and the "Security loops" table of earlier runs.
- [Decision log](docs/foundation/decisions.html): ADR-005, ADR-006, ADR-011,
  ADR-018, ADR-026, ADR-027, ADR-036, ADR-039, and any ADR a finding touches.
- Open tickets:
  `gh issue list --state open --search "security OR privacy OR auth" --limit 50 --json number,title`.

From these, write the **known list** for the reviewers, 20 lines at most:

- *Accepted*: a trade-off that an ADR or a threat-table row chose on purpose,
  with that ADR or row (for example, joining by link needs no verified email,
  ADR-018). Nothing else may be accepted.
- *Open*: a known gap, with its ticket (for example, notes in IndexedDB survive
  sign-out). It still counts against the score.

## 2. Bring up the target, run the tools

1. Run `pnpm workspace:start web` in the background, then take the web URL from
   `pnpm workspace:status`. The worktree has seeded scenarios A and B;
   `pnpm --filter floc-web db:trips` lists each trip and its members. If the
   server does not start, review from the code only and say so in the report.
2. Run the tools that do not depend on a model: `pnpm checks quick` (lint with
   the security plugin, the secret scan) and `pnpm audit --audit-level=moderate`.
   Each failure is a finding: put it in the merged list at its severity.
3. Read production passively, 10 requests at most, to see what local cannot:
   - `curl.exe -sI https://floc.live/` and `https://floc.live/login`: the
     headers match `next.config.ts` (CSP, HSTS, frame, `nosniff`, referrer),
     and nothing names the server or framework version.
   - `curl.exe -sI http://floc.live/`: it redirects to https.
   - `Resolve-DnsName -Type TXT floc.live`, `_dmarc.floc.live` and
     `resend._domainkey.floc.live`: SPF, DKIM and DMARC exist, and DMARC is not
     `p=none`.

## 3. Review round

Start three `floc:security-reviewer` agents **in one message**, so they run at
the same time:

| Reviewer | `model` | Lens, round 1 | Lens, round 2 |
|---|---|---|---|
| Opus 1 | `opus` (Opus 5.5) | Deep A | Deep B |
| Opus 2 | `opus` (Opus 5.5) | Deep B | Deep A |
| Sonnet | `sonnet` (Sonnet 5.5) | Sweep | Sweep |

Deep A is who gets in and what they can reach. Deep B is what gets sent in and
what breaks. Sweep checks every entry point once, so no Server Action,
procedure or route goes unread. Round 2 swaps the deep lenses, so each half
gets a fresh Opus.

Each prompt holds the worktree path, the target URL, the known list and the
lens. **Never** give the round number, an earlier score, an earlier finding or
what you fixed. A reviewer that knows the last score anchors to it.

## 4. Check the reports

1. Work out each score again from its findings with the formula in the agent
   file. If the number is different, use yours and say so.
2. Prove each critical, high and medium finding yourself, most severe first:
   a test or a request that does the attack.
   - It works: **confirmed**. Fix it in step 5.
   - It does not: **rejected**, only with evidence (the guard at `path:line`,
     or the attack test passing). Show the reason to Aidan. Take a rejected
     finding out of that reviewer's score.
   - You cannot tell: **unclear**. It stays in the score. List it for Aidan.
   - Low findings: fix one only if it is small and safe; list the rest.
3. Show Aidan one table: reviewer, model, lens, score, score after rejected
   findings. Under it, the merged findings, with the same problem from more
   than one reviewer on one line ("2 of 3").
4. **All three 9.0 or more after rejected findings → stop.** Go to step 6.

## 5. Fix

For each confirmed finding:

1. Follow `/floc:tdd`. The first test does the attack and fails. It stays in
   the suite beside the code it guards. A finding with no test is not fixed.
2. Fix the code. Every rule in AGENTS.md still holds.
3. If the fix adds or changes a control, change its row in security.html's
   threat table (`/floc:sync-docs`).

Then run `pnpm checks quick`. Red → fix it first.

- After round 1: back to step 3 with three **new** reviewers.
- After round 2: stop. Fixes from round 2 have their attack tests but no
  second review; say so.

If round 1 has no confirmed finding and a score is still under 9.0, the cause
is an unclear finding: ask Aidan about it before round 2.

## 6. Record and report

Add one row to the "Security loops" table in security.html, and make the table
the first time: date, commit, skill version (`plugins/floc/.claude-plugin/plugin.json`),
each round's three scores, findings fixed, findings open. Keep the last 10
rows. The same code scored twice shows how much the scores vary; a fall in a
later run is a reason to look, not proof of a new hole.

Then report in chat, in this order:

1. **Scores:** one row per round, one column per reviewer, then why the loop
   stopped (all 9.0+, two rounds, waiting on Aidan).
2. **Fixed:** one line each: the finding, the fix, the test file.
3. **Open:** each finding not fixed, and why (needs Aidan, unclear, low).
4. **Rejected:** each one, with its evidence.
5. **For Aidan:** ADR challenges, and fixes that wait for a yes.
6. **Known list:** as the reviewers got it.
7. **Not checked:** each area a reviewer said it could not check, and the
   Sweep's "n of N" entry points.
8. **What this loop cannot prove:** three model reviewers can miss the same
   thing. A 9.0 means they found no medium or worse in what they read, not
   that none exists. Before launch, get an outside pentest.

Run `pnpm checks pr` and give its result. Stop the dev server you started. The
state is `local, uncommitted`. End with one `Next:` line on what Aidan must
decide.
