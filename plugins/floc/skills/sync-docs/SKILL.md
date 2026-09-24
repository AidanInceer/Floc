---
name: sync-docs
description: Find every Floc doc page that the current diff makes untrue, update it in the same slice, and run pnpm docs:check. Use when the user says /floc:sync-docs, "update the docs", "which docs does this change", or before /floc:push when code that a doc describes has changed.
---

# sync-docs

Docs move with the code, in the same commit. This skill finds the pages a
change makes wrong and fixes them. It does not rewrite pages the change does
not touch.

`docs/` is gitignored — a doc edit shows in no diff and no commit. Say in the
report which pages you changed.

## 1. Read the change

```bash
git status --short; git diff --stat; git diff
```

Include untracked files. If the user named a commit range, diff that instead.

## 2. Map each change to its page

| The diff touches | Update |
|---|---|
| `db/schema.ts` | [ERD](../../../../docs/architecture/data-model/erd.html) block and relationships, and "Data model shape" in [architecture](../../../../docs/architecture/architecture.html) |
| Layers, seams, auth, money, trip state, files, deploy | [architecture](../../../../docs/architecture/architecture.html) |
| Trip access, roles, `assertAdmin`, a new door into a trip | [access](../../../../docs/architecture/access.html) |
| PII, tokens, signed links, webhooks, cookies, browser storage | [security](../../../../docs/architecture/security.html) (and `/privacy` in code) |
| A tRPC procedure | [API map](../../../../docs/architecture/api.html) |
| An env var, `railway.json`, a production fix | [runbook](../../../../docs/architecture/operations.html) |
| `.github/workflows/`, `scripts/verify.sh` | [CI](../../../../docs/architecture/ci.html) |
| Workflow, a skill or agent | [lifecycle](../../../../docs/architecture/lifecycle.html) and the skill table in `AGENTS.md` |
| The web/app split, `parity.json` | [multi-platform](../../../../docs/architecture/multi-platform.html) |
| Notifications, reminders, the cron | [notifications](../../../../docs/architecture/notifications.html) |
| A feature's behaviour | its page in `docs/product/domains/` |
| A Pro gate (`FEATURE_PLAN`) | [Pro tier](../../../../docs/product/monetisation/pro-tier.html) |
| A token, component or UI rule | [visual language](../../../../docs/design/visual-language.html) |
| What Floc is or is not for | [mission and values](../../../../docs/mission.html) |
| A decision other features must follow | [decision log](../../../../docs/adr/decisions.html) — a new record, never an edit |
| A domain word | [vocabulary](../../../../docs/vocab.html) and `floc/CONTEXT.md` |

Nothing matches → say "no doc change needed" and stop.

## 3. Edit the page

Read the page before you edit it. Change only what the diff makes untrue.

- **HTML is the source.** No markdown copy exists to regenerate from.
- **Plain words.** Short sentences, active voice, present tense — the
  [vocabulary](../../../../docs/vocab.html) voice. Say what is true now, not
  how it got there; a ticket number (`#285`) carries the history.
- **Name real files.** Grep that a path still exists before you write it.
- **Most pages are CRLF.** An edit keyed on LF finds nothing. Normalise,
  patch, restore — or write the whole file.
- **Strip editor leftovers** on lines you touch: `data-doc-block="auto-…"`,
  empty `class=""`, `contenteditable`.

**New page** → copy the shell of a sibling (`data-root` is the path back to
`docs/`, `data-page` is its id), add a `TREE` entry in `docs/assets/nav.js`,
and link it from `docs/index.html`. A page missing from `TREE` is unreachable.

**Moved page** → fix every link to it: grep `docs/`, `AGENTS.md` and
`plugins/`.

**Page no longer true at all** (a retired feature, a shipped mockup) → ask
before deleting it. The user has no git history for `docs/`.

## 4. Check

```bash
pnpm docs:check
```

It fails on a schema table missing from the ERD, a procedure missing from the
API map, or a broken link in `docs/` or `AGENTS.md`. It cannot see stale
prose — that part is yours.

## Report

Each page changed, one line on what changed. Pages you judged and left alone,
if the user would expect a change. Nothing else.
