# learnings.md — common agent pitfalls

Things that bite. Read before editing.

## Hub / repo

- Editing a `.md` doc source that doesn't exist — HTML *is* the doc, edit directly.
- Adding a `docs/` page without a `nav.js` `TREE` line — silently unreachable.
- `fetch`/ES modules in a docs page — breaks on `file://`, use `<script src>`.
- npm-style `"workspaces"` array — workspaces live in `pnpm-workspace.yaml` only.
- PowerShell commit here-string where `@'`/`'@` aren't alone on their lines — `@` leaks into subject. Verify `git log -1 --format=%s`.
- Running `pnpm verify`/`build` with dev server up — corrupts `.next`; user must delete by hand. Stop dev first; check `preview_list`, not `ps`.
- Skipping `CLAUDE.md` — it holds the real non-negotiables. One file at the root; there is no venture-level copy.
- Inventing/borrowing a `Closes` issue number — shuts someone else's issue.

## Venture / app

- Adding a `stop` or lifecycle-state table/column — both derived, not stored (rules 3–4).
- Treating "no dates" or "no forecast/location" as an error path — normal silent states (rules 9, 11).
- Writing a page-specific `loadXTab()` in `server/` instead of a reusable aggregate read.
- Forgetting `isNull(deletedAt)` on a new write, or copying a hard-delete exception without re-reading why it's one.
- Hand-rolling a membership check instead of `requireTripAccess`.
- Reaching for a hex colour instead of a token.
- `@/db` import inside `app/` — SQL only in `server/`.
- A `dark:` variant — token is wrong instead.
- Recalculating `expense_split` rows — they're snapshots.
- Persisting a timezone/offset — dates are `YYYY-MM-DD` strings.
