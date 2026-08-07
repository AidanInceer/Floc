---
name: docs-apply
description: Applies a refined docs document (from docs/input/refined/) to HTML doc pages and GitHub issues. Use when the user has approved a refined doc and wants to apply the changes, or when called by docs-ingest.
---

# docs-apply

Applies the `## Doc updates` and `## Backlog updates` sections from a refined doc.

## Quick start

```
/docs-apply my-notes.md    # filename only; reads from docs/input/refined/
```

## Workflow

1. **Read** `docs/input/refined/<filename>.md`. Parse the two sections.
2. **Apply doc updates** — edit existing HTML pages or create new ones. See [REFERENCE.md](REFERENCE.md) for the HTML shell conventions.
3. **Apply backlog updates** — create or update GitHub issues. See [REFERENCE.md](REFERENCE.md) for the `gh` commands.
4. **Report** — list every file changed and every issue created/updated. Terse.

## Constraints

- Scope is strictly `docs/` HTML pages and GitHub issues — no code, schema, or config changes.
- If a doc update would require a schema or code change (e.g. ERD), note it as out-of-scope and skip it.
- Issues live in `AidanInceer/Waypoint`, not the hub repo.
- Prefer adding a comment over rewriting an issue body unless the refined doc explicitly says to replace it.
