---
name: implement-feature
description: Take a feature — from prior context, a prompt, or one or more tickets — and build it on Floc web and app test-first, checking parity, UI consistency and docs, then report a short summary. Use when the user says /floc:implement-feature, or after a grilling or prototyping session wants the agreed feature built end to end.
---

# implement-feature

Build one feature, both surfaces, the Floc way. Read the source of truth
before you code, not after. Loop until it works — do not report a half-built
thing as done.

## 1. Pin the scope

Gather what the feature is from, in this order: prior chat context, the user's
prompt, and any named ticket(s) (`gh issue view <n>`). Multiple tickets is
fine. State the scope back in one line and start — ask only if a missing
detail blocks correct work.

## 2. Both surfaces running

Confirm web (`:3000`) and app (Metro `:8081` + emulator) answer. If either is
down, use the `/floc:run` skill to bring the loop up and **prove** each piece
answers. Do not assume a started process is a working one.

## 3. Read before you build

Read the parts of `AGENTS.md`, the relevant `docs/` pages (architecture,
access, the feature's domain page, visual language) and existing code that the
feature touches. Respect the **Invariants** — integer money, soft-delete,
trip state from data, day-first itinerary, nullable dates, no timezones.

## 4. Build test-first

Red → green → refactor (`/mattpocock-skills:tdd`). Failing test first, watch it
fail for the right reason, least code to pass, then tidy. SQL in `server/`
only; mutations as Server Actions in `actions.ts`; validate at the door;
tokens not hex; no emoji; British English, real content. Keep to the file /
function / complexity limits — split beats adding a line. Coverage floor 80%.

## 5. Parity — same feature, both surfaces

Where the feature applies to both, build it on web **and** app to the shared
visual language. A new API procedure needs a line in `parity.json`
(`pnpm parity --fix` writes the boring half, the `why` is yours). Run
`pnpm parity`.

## 6. Fix, and loop

Typecheck, lint, test. If the app or web crashed, rerun them (step 2) and
carry on — this is a loop, not one pass. Do not move on with a red check.

## 7. Screenshots, both surfaces

Open the windows / tabs the feature lives in on each surface and capture them:

- Web — browser pane `computer {action: "screenshot"}`.
- App — `"$ANDROID_HOME/platform-tools/adb.exe" exec-out screencap -p > shot.png`
  (write to the scratchpad, not the repo).

Compare the two for visual UI consistency — same tokens, spacing, type, states.
Fix any drift.

## 8. Walk the flow

Drive a real user flow through the feature on **both** surfaces — web via the
browser pane, app via `adb shell input tap` / `input text`. Confirm it does
what the ticket asked, not just that it renders.

## 9. Docs move with the code

Run `/floc:sync-docs`: it finds every doc page the change makes untrue and
updates it. Same slice, not a follow-up.

## 10. Report

Short. What you built, both surfaces done or the gap and why, checks green,
one next action (usually `/floc:push`). Nothing else.

## Gotchas

- **Don't push.** This skill stops at a working, verified local build. Landing
  it is `/floc:push`'s job.
- **Schema change** → `/floc:schema-change`. It is not done until `local.db`
  has the migration, or dev dies on `no such column`.
- **New mobile package** → `/floc:add-mobile-dep`, never `pnpm add`.
- **`pnpm verify` is safe with servers up** (builds into `.next-verify`); a bare
  `build`/`fitness` writes `.next` and needs the servers stopped first.
- **No new venture, no scope creep.** One feature. If the work wants slicing,
  that's `/floc:to-tickets`, not this.
