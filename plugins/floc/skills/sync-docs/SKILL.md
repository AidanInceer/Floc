---
name: sync-docs
description: Find every Floc doc page that the current diff makes untrue, fix it with the smallest edit in the same slice, and run pnpm docs:check. Restrained by default — most changes need a line or two on an existing page, or nothing; never a new page without asking. Use when the user says /floc:sync-docs, "update the docs", "which docs does this change", or before /floc:push when code that a doc describes has changed.
---

In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.

# sync-docs

Docs move with the code, in the same commit. This skill finds the pages a
change makes wrong and fixes them. It does not rewrite pages the change does
not touch.

**Restraint first.** Aidan wants the docs clean, crisp and short, and his to
shape. Most changes need nothing, or a sentence or two changed on a page that
already exists. A new page is rare: ask him first. Leaving a doc alone is a
good outcome; adding words is the cost.

The docs live in the private `AidanInceer/floc-docs` repo. The main checkout holds the clone and every worktree's `docs/` links to it, so edit `docs/...` as usual. Doc edits never show in the Floc diff: list the pages you changed in your report, and hand that list to `/floc:push --docs`, which commits and pushes only those pages.

## 1. Read the change

```bash
git status --short; git diff --stat; git diff
```

Include untracked files. If the user named a commit range, diff that instead.

## 2. Map each change to its page

| The diff touches | Update |
|---|---|
| `db/schema.ts` | [ERD](docs/engineering/data-model.html) block, relationships and "Tables by feature"; the feature page's *Built on* |
| Layers, seams, trip state, deploy | [architecture](docs/engineering/index.html) |
| Sign-in, sessions, Better Auth | [security](docs/engineering/security.html#auth) |
| Trip access, roles, `assertAdmin`, a new door into a trip | [access](docs/engineering/access.html) |
| PII, tokens, signed links, webhooks, cookies, browser storage | [security](docs/engineering/security.html) (and `/privacy` in code) |
| A tRPC procedure | [API map](docs/engineering/api.html) |
| An env var, `railway.json`, a production fix | [runbook](docs/engineering/operations.html) |
| `.github/workflows/`, `scripts/checks/` | [CI](docs/process/lifecycle.html#ci) |
| Workflow, a skill or agent | [lifecycle](docs/process/lifecycle.html) and the Agent skills section in `AGENTS.md` |
| The web/app split, `parity.json` | [multi-platform](docs/engineering/platforms.html) |
| Notifications, reminders, the cron | [notifications](docs/product/notifications/index.html) |
| A feature's behaviour or build (money maths, the notes socket, file storage, billing) | its folder, `docs/product/<feature>/` — the rules, *How it works*, and *Built on* |
| A Pro gate (`FEATURE_PLAN`) | [Pro tier](docs/product/pro/index.html) |
| A token, component or UI rule | [visual language](docs/design/visual-language.html) |
| What Floc is or is not for | [mission and values](docs/foundation/mission.html) |
| A decision other features must follow | [decision log](docs/foundation/decisions.html) — a new record, never an edit |
| A domain word | [vocabulary](docs/foundation/vocab.html) and `floc/CONTEXT.md` |

Nothing matches → say "no doc change needed" and stop.

## 3. Edit the page

Read the page before you edit it. Change only what the diff makes untrue.

- **Smallest edit.** Replace a sentence before you add one. Add a line before
  a paragraph, a paragraph before a section. One change never earns a new
  section.
- **Net length rarely grows.** Delete what the change made obsolete instead of
  adding a note beside it. No changelog, no history, no "previously", no
  restating what the code or another page already says — link it.
- **No new page by default.** If the fact has no home, put one line on the
  nearest page. Only when that cannot work, ask Aidan before creating a page.
- **Never restore what was cut.** The docs were cut on purpose
  ([keep it short](docs/process/editing-docs.html#short)). Do not bring back a
  section, a diagram or a page, and never rewrite a whole page: line edits only.

- **HTML is the source.** No markdown copy exists to regenerate from.
- **Plain words.** Short sentences, active voice, present tense — the
  [vocabulary](docs/foundation/vocab.html) voice. Say what is true now, not
  how it got there; a ticket number (`#285`) carries the history.
- **Name real files.** Grep that a path still exists before you write it.
- **Most pages are CRLF.** An edit keyed on LF finds nothing. Normalise,
  patch, restore — or write the whole file.
- **Strip editor leftovers** on lines you touch: `data-doc-block="auto-…"`,
  empty `class=""`, `contenteditable`.

**New page** (only after Aidan says yes) → copy the shell of a sibling (`data-root` is the path back to
`docs/`, `data-page` is its id). Add a `TREE` entry in `docs/assets/nav.js`
with a `blurb`, and `related` ids and `adr` numbers where they fit — the
breadcrumb, hub cards and footer links come from it. A new feature is a folder
`docs/product/<feature>/` whose `index.html` has *Rules* and *Built on*. Layout
rules: [editing these docs](docs/process/editing-docs.html).

**Moved page** → fix every link to it: grep `docs/`, `AGENTS.md` and
`plugins/`.

**Page no longer true at all** (a retired feature, a shipped mockup) → ask
before deleting it. The user has no git history for `docs/`.

## 4. Check

```bash
pnpm docs:check
```

It fails on a schema table missing from the ERD, a procedure missing from the
API map, a broken link or anchor in `docs/`, `AGENTS.md` or a skill, a page missing from
`TREE`, a bad `related` id or `adr` number, or a feature page without *Built on*.
It cannot see stale prose — that part is yours.

## 5. Claim the pages

```bash
pnpm delivery claim --docs <page> <page>
```

Every session edits the same docs clone, and Git commits a whole page. The claim
records that this branch edited these pages. If `shared` names another branch,
that branch has unpushed edits on the same page: leave its lines alone, and say
so in your report. Whichever of you finishes first pushes both sets of edits.

## Report

Each page changed, one line on what changed and the net lines added or
removed. Pages you judged and left alone, if the user would expect a change.
Any page another branch is also editing. Nothing else.
