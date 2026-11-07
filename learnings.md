# learnings.md — pitfalls that have bitten

Read before editing. Only traps not already a rule in [`AGENTS.md`](AGENTS.md) live here; rule numbers refer to its Invariants. Mobile pitfalls live in [`.claude/rules/mobile.md`](.claude/rules/mobile.md).

## Repo and tooling

- **Skipping `AGENTS.md`.** It holds the real rules. `CLAUDE.md` only imports it. Folder rules sit in `.claude/rules/`, which it links.
- **Looking for a `.md` source of a doc page.** The HTML *is* the doc — edit it.
- **A `docs/` page with no `TREE` entry in `assets/nav.js`.** It is unreachable.
- **`fetch` or ES modules in a docs page.** Both break on `file://`. Use `<script src>`.
- **A `"workspaces"` array in `package.json`.** Workspaces live in `pnpm-workspace.yaml` only.
- **A PowerShell commit here-string with `@'` or `'@` not alone on its line.** The `@` leaks into the subject. Check with `git log -1 --format=%s`.
- **A brace glob in `eslint.config.mjs`.** The `brace-expansion` security pin breaks `minimatch@3`, and ESLint dies with "expand is not a function", naming neither. List the extensions one by one.
- **`*/` inside a block comment** (a glob like `**/*.ts` in prose). It ends the comment early. Reword it.
- **Shell calls that drift.** A `cd` persists, so the next `cd floc/apps/web` fails. Inline Python and long quoted `bash -c` lines break on quotes. Use absolute paths; put anything over one line in a scratchpad `.mjs` or `.ps1`. `Glob` a path before `Read` — `floc-core/src/design/tokens.ts` is a file, not a folder.
- **The warning `The "pnpm" field in package.json is no longer read`.** Global npm `pnpm` 10 ran instead of corepack's pinned 9. Harmless, but the overrides applied are the yaml copy. Run `corepack enable` once. Never delete the `package.json` copy — CI's pnpm 9 reads only that one.
- **Port 3000 held by another chat's `floc-web`.** Do not start a second one on 3001. Point the pane at the running server (`preview_start {url: "http://localhost:3000"}`) or ask the user to stop it.
- **A shell edit in the main checkout** (`node -e`, `sed -i`, a copy). The guard sees only Edit and Write, but the rule is the same: the edit strands there, blocks the next pull and leaks into every session that starts there. Make the change in a task worktree.
- **A plain string replace on a CRLF file.** Most files here are CRLF, so an LF-keyed match silently finds nothing. Normalise, patch, restore.

## App

- **A page-specific `loadXTab()` in `server/`.** Write a reusable aggregate read instead.
- **Copying a hard-delete exception without re-reading why it is one** (rule 8).
- **Guessing a token name from the docs' prose.** The ground is `--paper`, the surface `--sheet`, the hairline `--rule`, the blue `--pen`. "Canvas", "white" and "blue" are descriptions, not variables. `@floc/core/design/tokens` is the list.
- **Bumping `better-auth` past 1.6.** 1.7 wants an `account.issuer` column the schema lacks, and sign-up returns 500. Pinned `~1.6.30`; moving needs a migration.
- **Calling `requireTripAccess` from a route handler.** `notFound()` throws a Next navigation signal the handler cannot catch. Use `findTripAccess`, which returns `null` (#287).
- **Restarting `next dev` after a dependency change without clearing `.next`.** It serves the old module, and the error names the wrong cause.
