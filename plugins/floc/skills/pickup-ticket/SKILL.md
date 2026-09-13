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
- It is labelled `wayfinder:grilling` → it needs grilling before it can be built. Offer the user: grill it now (`grilling` skill), or skip it. If the grilling splits it into new tickets, run `/floc:to-tickets` with this ticket's number — it tags this parent `on-develop` and pops it off the stack. The children get built, not the parent.
- Its `## Blocked by` names an issue that is still open and not `on-develop` → report the blocker and move to the next ticket.

### 3. Confirm

Show the user the ticket: number, title, type label, what it delivers, acceptance criteria, blocked-by. Ask to confirm before starting work.

### 4. Build it

Work on `develop`. No feature branch. Keep to the ticket's acceptance criteria.

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
