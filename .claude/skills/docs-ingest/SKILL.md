---
name: docs-ingest
description: Orchestrates the full docs-update pipeline from raw voice/text notes to HTML doc changes and GitHub backlog updates. Use when the user wants to process raw notes or a voice dump into documentation, invoke with /docs-ingest [filename].
---

# docs-ingest

Entry point for the docs update pipeline: refine → review gate → apply → archive.

## Quick start

```
/docs-ingest                   # picks newest file in docs/input/raw/
/docs-ingest my-notes.md       # explicit filename (name only, not full path)
```

## Workflow

1. **Resolve filename** — if no arg, find the newest `.md` in `docs/input/raw/`. Abort if folder is empty.
2. **Run docs-refine** — invoke the `docs-refine` skill inline with the resolved path.
3. **Gate** — tell the user: _"Refined doc at `docs/input/refined/<filename>.md`. Reply `approve` to apply, or give feedback to revise."_ Re-run `docs-refine` with their feedback if needed. Repeat until approved.
4. **Run docs-apply** — invoke the `docs-apply` skill inline with `docs/input/refined/<filename>.md`.
5. **Archive** — run the archive script:
   ```powershell
   .claude/skills/docs-ingest/scripts/archive.ps1 -Filename "<filename>"
   ```
6. **Report** — what changed in docs, what issues were created/updated, where archived files landed.
