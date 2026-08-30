---
name: pickup-ticket
description: Take the top ticket off the Priority stack in AidanInceer/Waypoint and start work on it. Use when the user asks what's next, or wants to pick up the next ticket.
---

# pickup-ticket

Take the **top** ticket off the `Priority` stack issue and start it.

## Process

### 1. Read the stack

```bash
gh issue list --repo AidanInceer/Waypoint --state open --search "Priority in:title" --json number,body
```

If the stack is missing or empty, say so and point at `/prioritise-tickets`.

### 2. Walk down to the first startable ticket

Starting at the top, skip a ticket if any of these hold — and say which and why:

- It is labelled `on-develop` or `future-work` → it should not be in the stack. Remove that line from the stack body and carry on down.
- It is closed → remove the line, carry on.
- It is labelled `wayfinder:grilling` → it needs grilling before it can be built. Offer the user: grill it now (`grilling` skill), or skip it.
- Its `## Blocked by` names an issue that is still open and not `on-develop` → report the blocker and move to the next ticket.

### 3. Confirm

Show the user the ticket: number, title, type label, what it delivers, acceptance criteria, blocked-by. Ask to confirm before starting work.

### 4. Start the work

Follow the repo workflow in `CLAUDE.md`:

- Work on `develop`. No feature branch.
- One commit for the ticket. Subject: `<version> #<issue>: <type>: <description>`.
- Bump `ventures/waypoint/apps/web/package.json` in the same commit — minor for `feat`, patch for `fix`/`refinement`.
- Body ends `Closes AidanInceer/Waypoint#<n>`.
- Run `pnpm verify` green before pushing. Stop the dev server first.

### 5. Pop the stack once it is on develop

The moment the ticket's commit is pushed to `develop`:

```bash
gh issue edit <n> --repo AidanInceer/Waypoint --add-label "on-develop"
```

Then remove that ticket's line from the `Priority` issue body and renumber:

```bash
gh issue edit <priority-issue-number> --repo AidanInceer/Waypoint --body-file <file>
```

**A ticket leaves the stack when it is tagged `on-develop`, not when work starts.** If the work is abandoned, the ticket stays where it is.

### 6. Report back

Ticket number and title, what was built, whether `pnpm verify` passed, whether it was pushed and popped, and what is now on top of the stack.

## Constraints

- Only ever take from the top. Never reorder here — that is `/prioritise-tickets`.
- Never close the issue by hand. `Closes` fires when `develop` reaches `main`.
- Never pick up the `Priority` issue itself.
