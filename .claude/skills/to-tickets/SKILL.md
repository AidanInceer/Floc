---
name: to-tickets
description: Break a plan, spec, or conversation into tracer-bullet GitHub issues in AidanInceer/Waypoint, each declaring its blocking edges. Use when slicing a feature into tickets, or when backlog-refine calls it.
---

# to-tickets

Break a plan into **tracer-bullet** GitHub issues in `AidanInceer/Waypoint`.

## Process

### 1. Gather context

Work from whatever is already in conversation. If an argument is passed (issue number, file path, or topic), read it fully before proceeding.

### 2. Explore the codebase

If not already oriented, read enough of the code to use the project's domain vocabulary in ticket titles and descriptions. Respect any ADRs or constraints in the area being touched.

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

- **Title** — short descriptive name
- **Blocked by** — which other tickets gate it (or "none")
- **Delivers** — the end-to-end behaviour, from the user's perspective

Ask:
- Does the granularity feel right?
- Are the blocking edges correct — does each ticket only depend on tickets that genuinely gate it?
- Should any be merged or split?

Iterate until the user approves.

### 5. Create the issues

Create approved tickets in `AidanInceer/Waypoint`, in dependency order (blockers first so they get real issue numbers to reference).

```bash
gh issue create \
  --repo AidanInceer/Waypoint \
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

Do **not** close or modify any parent issue.

### 6. Report back

List every created issue: number, title, blocking edges. If called from `backlog-refine`, return so it can add the hyperlinks to the backlog HTML.

## Constraints

- Avoid specific file paths or code snippets in issue bodies — they go stale fast. Exception: a prototype snippet that encodes a decision precisely (state machine, type shape, schema diff) is worth including; note briefly that it came from a prototype.
- Issues live in `AidanInceer/Waypoint`, not the hub repo.
