---
name: pickup-ticket
description: Take the top ticket off the Priority stack in AidanInceer/Floc and start work on it. Use when the user asks what's next, or wants to pick up the next ticket.
---

# pickup-ticket

Take the **top** ticket off the `Priority` stack issue and start it.

## Process

### 1. Read the stack

```bash
gh issue list --repo AidanInceer/Floc --state open --search "Priority in:title" --json number,body
```

If the stack is missing or empty, say so and point at `/floc:prioritise-tickets`.

### 2. Walk down to the first startable ticket

Starting at the top, skip a ticket if any of these hold — and say which and why:

- It is labelled `on-develop` or `future-work` → it should not be in the stack. Remove that line from the stack body and carry on down.
- It is closed → remove the line, carry on.
- It is labelled `grilling` → it needs grilling before it can be built. Offer the user: grill it now (`/floc:grill`), or skip it. The grill writes decisions and acceptance criteria into the ticket and keeps it one ticket; then build it here. Only if the user asks for a split, run `/floc:to-tickets` with this ticket's number — it tags this parent `on-develop` and pops it off the stack.
- Its `## Blocked by` names an issue that is still open and not `on-develop` → report the blocker and move to the next ticket.

### 3. Confirm

Show the user the ticket: number, title, type label, what it delivers, acceptance criteria, blocked-by.

**Auto** — start without asking when the ticket has acceptance criteria and the user said `auto`, "just do it", or asked for several tickets. Otherwise ask to confirm.

### 4. Build it

Work on `develop`. No feature branch. Keep to the ticket's acceptance criteria.

1. **Test first.** Failing test for each criterion, watch it fail, then the code (`/floc:tdd`).
2. **Schema change** → `db:generate`, then run the new `drizzle/*.sql` against `local.db` now, not at preflight.
3. **New API procedure** → its `parity.json` line. Draft the `why` from the ticket; show it in the report rather than stopping to ask.
4. **Look at it before the user does.** UI change → screenshot every surface it touches (web via the Browser pane; app via `adb exec-out screencap`), in light **and** dark. Check each against [visual language](../../../../docs/design/visual-language.html): tokens, spacing, alignment, no heading-above-heading, web and app agree. Fix what is off, then shoot again. Send the final shots with `SendUserFile`.
5. **App flow changed** and the emulator is up → `pnpm --filter floc-mobile maestro`. Extend `app.yaml` if the ticket adds a screen.

### Several tickets in one go

One ticket → one `/floc:push` → the next ticket. Never batch several tickets into one commit: a session cut off by a usage limit then loses one ticket, not all of them.

### 5. Land it with `/floc:push`

Run `/floc:push` with this ticket's number. It owns the commit rules, the bump,
verify, the `on-develop` label and popping the stack.

**A ticket leaves the stack when it is tagged `on-develop`, not when work starts.** If the work is abandoned, the ticket stays where it is.

### 6. Report back

Ticket number and title, what was built, the `/floc:push` result, and what is now on top of the stack.

## Constraints

- Only ever take from the top. Never reorder here — that is `/floc:prioritise-tickets`.
- Never close the issue by hand. `Closes` fires when `develop` reaches `main`.
- Never pick up the `Priority` issue itself.
