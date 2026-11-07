---
name: pickup-ticket
description: Show the top five startable tickets on the Priority stack in AidanInceer/Floc, let the user choose one, then start work on it. Use when the user asks what's next, or wants to pick up the next ticket.
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# pickup-ticket

Show the top five startable tickets on the `Priority` stack, wait for the user to choose, then start the one they chose.

## Process

### 1. Read the stack

```bash
gh issue list --repo AidanInceer/Floc --state open --search "Priority in:title" --json number,body
```

If the stack is missing or empty, say so and point at `/floc:prioritise-tickets`.

The stack is split into phases (`### Phase N — …` headings, one `phase:N` label per ticket). Numbering runs through every phase. The **current phase** is the lowest phase that still has a ticket in the stack.

### 2. Walk down to the first five startable tickets

Walk the current phase only, from the top, until you have five. Skip a ticket if any of these hold — and say which and why:

- It is labelled `on-develop` or `future-work` → it should not be in the stack. Remove that line from the stack body and carry on down.
- It is closed → remove the line, carry on.
- Its `## Blocked by` names an issue that is still open and not `on-develop` → note the blocker and move to the next ticket.

A ticket labelled `grilling` is **startable**. The label is intentional: it is the alignment step with Aidan before the build, not a defect. Start it with `/floc:grill`. The grill writes decisions and acceptance criteria into the ticket and keeps it one ticket; then build it here. Never offer to skip it for being `grilling`, and never flag the label as a problem. Only if the user asks for a split, run `/floc:to-tickets` with this ticket's number — it tags this parent `on-develop` and pops it off the stack.

**Phase gate.** Fewer than five startable in the current phase → show those, and say how many more the next phase has. Nothing startable → name what blocks each ticket and ask before listing the next phase. Never cross a phase silently.

A ticket in the stack with no `phase:N` label, or whose label does not match its heading → report it and point at `/floc:prioritise-tickets`. Do not guess its phase.

### 3. Show five, then wait

Before anything else — no worktree, no grill, no reading code — show the list in stack order, one line each: number, title, phase, type label, `grilling` if it has it, and what it delivers in a few words. Name any ticket you skipped and why.

Then stop and let the user choose. Start only the ticket they name.

### 4. Build it

Make the ticket its own worktree, then build only there:

```bash
pnpm workspace:new <issue>-<short-name>
```

It branches `feature/<issue>-<short-name>` from `origin/develop` into `.claude/worktrees/`, installs, gives it its own ports, seeded database and uploads, and links the shared docs. Continue the session in that folder (or tell the user to open one there). Never edit the main checkout for a ticket. Keep to the ticket's acceptance criteria.

1. **Test first.** Failing test for each criterion, watch it fail, then the code (`/floc:tdd`).
2. **Schema change** → ask Aidan first (AGENTS.md). Then `db:generate`, and run the new `drizzle/*.sql` against this worktree's database now.
3. **New API procedure** → its `parity.json` line. Draft the `why` from the ticket; show it in the report rather than stopping to ask.
4. **Look at it before the user does.** UI change → screenshot every surface it touches (web via the Browser pane; app via `adb exec-out screencap`), in light **and** dark. Check each against [visual language](docs/design/visual-language.html): tokens, spacing, alignment, no heading-above-heading, web and app agree. Fix what is off, then shoot again. Send the final shots with `SendUserFile`.
5. **App flow changed** and the emulator is up → `pnpm --filter floc-mobile maestro`. Extend `app.yaml` if the ticket adds a screen.

### Several tickets in one go

One ticket → one `/floc:push` → the next ticket. Never batch several tickets into one commit: a session cut off by a usage limit then loses one ticket, not all of them.

### 5. Land it with `/floc:push`

Run `/floc:push` with this ticket's number. It owns the commit rules, the PR to `develop` and the finish after the merge.

**A ticket leaves the stack when its PR lands on `develop`**: `pnpm delivery finish` labels it `on-develop` and pops it. It closes when the release reaches `main`. If the work is abandoned, the ticket stays where it is.

### 6. Report back

Ticket number and title, what was built, and the `/floc:push` result (PR link). The stack pops when the PR lands, so name the next ticket as 'next once this lands'.

## Constraints

- Only take the ticket the user chose from the list. Never reorder or re-phase here — that is `/floc:prioritise-tickets`.
- Never close the issue by hand. `Closes` fires when `develop` reaches `main`.
- Never pick up the `Priority` issue itself.
