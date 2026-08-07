---
name: docs-refine
description: Reads raw notes from docs/input/raw/ alongside existing HTML docs, then writes a structured refined document to docs/input/refined/ with doc-update and backlog-update sections. Use when the user wants to process raw notes before applying them, or when called by docs-ingest.
---

# docs-refine

Read-only analysis step. Produces a structured refined doc for human review — no HTML or issue writes.

## Quick start

```
/docs-refine my-notes.md    # filename only; reads from docs/input/raw/
```

## Workflow

1. **Read** `docs/input/raw/<filename>.md`.
2. **Read relevant docs** — use keywords from the notes to find which HTML pages apply. Always read `docs/assets/nav.js` for the full TREE. Skim `docs/backlog/ideas.html` and `docs/backlog/tickets.html` to avoid duplicating existing items.
3. **Clarify** — ask the user only if something is genuinely ambiguous. One message, minimal questions.
4. **Write** the refined doc to `docs/input/refined/<filename>.md`. See [REFERENCE.md](REFERENCE.md) for the exact template.
5. **Tell the user** the file is ready and where to find it.

## Constraints

- No writes to `docs/` HTML files or GitHub issues.
- Surface what the notes say; don't editorialize.
- If notes mention out-of-scope items (code, design), add an `## Out of scope` section — awareness only.
