---
name: backlog-refine
description: Refines the local backlog docs and creates/closes fleshed-out GitHub issues from high-level notes. Reads docs/backlog/ HTML pages and existing GitHub issues, takes user input, optionally grills the user on unclear items, updates the local backlog HTML, then creates/updates/closes GitHub issues via to-issues. Use when the user wants to refine the backlog, groom ideas into tickets, remove dropped features, or sync local notes to GitHub.
---

# backlog-refine

Bridges the local backlog (high-level bullet notes in `docs/backlog/`) and GitHub issues (fleshed-out tickets in AidanInceer/Waypoint). Handles adding new items and removing dropped ones — in both places.

## Quick start

```
/backlog-refine                       # full grooming session
/backlog-refine "add trip export"     # seed with a specific topic
/backlog-refine "drop offline mode"   # remove a feature and close its tickets
```

## Workflow

1. **Read current state** — read all `docs/backlog/*.html` pages and pull open GitHub issues. See [REFERENCE.md](REFERENCE.md) for the `gh` command.
2. **Take input** — use the seed if provided, otherwise ask what to groom.
3. **Grill if needed** — if the item is vague or has unresolved design decisions, invoke `mattpocock-skills:grilling` inline. Skip if the item is clear or being dropped.
4. **Dropping a feature** — find all local entries and linked issues, close issues with a reason comment, remove bullets from the HTML. See [REFERENCE.md](REFERENCE.md) for the close flow and the confirm-before-close rule.
5. **Update local backlog HTML** — promote/refine bullet points; link each ticketed item to its GitHub issue(s) with `<a href>` hyperlinks. See [REFERENCE.md](REFERENCE.md) for the link format.
6. **Create issues via to-tickets** — invoke `to-tickets` for items ready to be ticketed. It drafts slices, quizzes you, then creates in `AidanInceer/Waypoint`.
7. **Back-link** — after issues are created, add the hyperlinked issue numbers to the relevant backlog HTML bullets.
8. **Report** — HTML files changed, issues created/closed (number + title + reason), anything left un-ticketed.

## Conventions

- Local backlog = high-level notes only; GitHub issues = full spec with acceptance criteria.
- Links in HTML use full GitHub URLs — clickable when the doc site is open locally.
- Issues live in `AidanInceer/Waypoint`, not the hub repo.
- Don't rewrite existing issue bodies unless explicitly asked.
