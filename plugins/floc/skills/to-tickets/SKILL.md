---
name: to-tickets
description: Break a plan, spec, or conversation into tracer-bullet GitHub issues in AidanInceer/Floc, each labelled and declaring its blocking edges. Use when slicing a feature into tickets.
---

# to-tickets

Break a plan into **tracer-bullet** GitHub issues in `AidanInceer/Floc`.

New issues come out **unprioritised** — they are not added to the `Priority` stack here. `/floc:prioritise-tickets` places them; `/floc:pickup-ticket` works them.

## Process

### 1. Gather context

Work from whatever is already in conversation. If an argument is passed (issue number, file path, or topic), read it fully before proceeding.

### 2. Explore the codebase

Read [mission and values](../../../../docs/mission.html) and the [decision log](../../../../docs/adr/decisions.html) first. If not already oriented, read enough of the code to use the project's domain vocabulary in ticket titles and descriptions. Respect any ADRs or constraints in the area being touched.

**Check the request's factual premises against the code before writing a ticket around them.** A request often carries an assumption about how the app works today that is out of date — "move off SQLite" when the app already runs Turso, "add X" when X half-exists. Verify each premise, and if one is wrong say so plainly at the top of the breakdown and reshape that ticket around what is actually true. A ticket built on a false premise wastes a whole context window later.

Look for prefactor opportunities — "make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets:

- Each slice cuts a narrow but complete path through every layer (schema, API, UI, tests) — vertical, not a horizontal layer-cake
- A completed slice is demoable or verifiable on its own
- Each slice fits in a single fresh context window
- Any prefactoring tickets go first

**Wide refactors are the exception.** A wide refactor (rename a column, retype a shared symbol) fans across the whole codebase. Don't force it into a vertical slice; use expand–contract: add the new form alongside the old (expand), migrate call sites in batches (each its own ticket), then delete the old form once no caller remains (contract).

Give each ticket its **blocking edges** — which tickets must complete before it starts.

### 4. Quiz the user

Present the breakdown as a numbered list. For each ticket show:

- **Title** — short descriptive name, already prefixed with its feature category (`money:`, `platform:`, `explore:` …) so `/floc:prioritise-tickets` has nothing to re-title
- **Blocked by** — which other tickets gate it (or "none")
- **Delivers** — the end-to-end behaviour, from the user's perspective

Flag anything the user must decide before a ticket can be built — a product name, a vendor choice — as its own line. The ticket does the work; it does not make the decision for them.

Ask:
- Does the granularity feel right?
- Are the blocking edges correct — does each ticket only depend on tickets that genuinely gate it?
- Should any be merged or split?

Iterate until the user approves.

### 5. Create the issues

Create approved tickets in `AidanInceer/Floc`, in dependency order (blockers first so they get real issue numbers to reference).

**Approval can arrive sideways.** "Yes, create those" tacked onto the front of another command still counts. Do not re-ask.

Apply the type label at creation — `--label "type:feat" | "type:fix" | "type:refinement"` — every ticket, no exceptions. A research or prototype ticket carries its `wayfinder:*` label **and** a type label. Leaving the type off pushes the work onto `/floc:prioritise-tickets`.

```bash
gh issue create \
  --repo AidanInceer/Floc \
  --title "<title>" \
  --body "$(cat <<'EOF'
## What to build

<End-to-end behaviour this ticket makes work, from the user's perspective. Not a layer-by-layer implementation list.>

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

<Issue numbers and titles of blocking tickets, or "None — can start immediately.">
EOF
)"
```

Put `Parent: #<n>` as the first line of each child body when the tickets come from a parent issue.

### 5b. Retire the parent (split from a ticket)

When the tickets come from an existing issue — most often a `grilling` ticket the user asked to split after `/floc:grill` — the children now cover it. No commit will ever close the parent, so it must not sit in the stack. Do all three:

1. Add a `## Split into` section to the end of the parent body, one `- #<n> <title>` per child.
2. Label it: `gh issue edit <parent> --repo AidanInceer/Floc --add-label on-develop`.
3. Remove the parent's line from the `Priority` issue body, and renumber.

`/floc:release` closes it once every child is closed. Do not close it by hand here.

Skip this only if the user says the parent still holds work of its own.

### 6. Report back

List every created issue: number, title, type label, blocking edges. Then remind the user to run `/floc:prioritise-tickets` — until they do, the new tickets are not in the `Priority` stack and `/floc:pickup-ticket` will not see them.

## Constraints

- Avoid specific file paths or code snippets in issue bodies — they go stale fast. Exception: a prototype snippet that encodes a decision precisely (state machine, type shape, schema diff) is worth including; note briefly that it came from a prototype.
- Issues live in `AidanInceer/Floc`, not the hub repo.
- Blocked-by edges go in the body under `## Blocked by` as `#<n>`, never as a label — `/floc:prioritise-tickets` and `/floc:pickup-ticket` read them from there.
- Never touch the `Priority` issue from this skill, except to pop a retired parent (step 5b).
- Every created ticket gets a category-prefixed title and exactly one `type:` label at creation.
- Never build a ticket on an unverified claim about the current codebase.
