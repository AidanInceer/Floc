# learnings.md — pitfalls that have bitten

Read before editing. Rule numbers refer to the Invariants in [`AGENTS.md`](AGENTS.md).

## Repo and tooling

- **Skipping `AGENTS.md`.** It holds the real rules. `CLAUDE.md` only imports it; there is no second copy.
- **Looking for a `.md` source of a doc page.** The HTML *is* the doc — edit it.
- **A `docs/` page with no `TREE` entry in `assets/nav.js`.** It is unreachable.
- **`fetch` or ES modules in a docs page.** Both break on `file://`. Use `<script src>`.
- **A `"workspaces"` array in `package.json`.** Workspaces live in `pnpm-workspace.yaml` only.
- **A PowerShell commit here-string with `@'` or `'@` not alone on its line.** The `@` leaks into the subject. Check with `git log -1 --format=%s`.
- **A bare `pnpm build` or `fitness` with the dev server up.** It corrupts `.next`. `pnpm verify` is safe (it builds into `.next-verify`); for the others, stop dev first — check `preview_list`, not `ps`.
- **Inventing or borrowing a `Closes` issue number.** It closes someone else's issue.
- **A brace glob in `eslint.config.mjs`.** The `brace-expansion` security pin breaks `minimatch@3`, and ESLint dies with "expand is not a function", naming neither. List the extensions one by one.
- **`*/` inside a block comment** (a glob like `**/*.ts` in prose). It ends the comment early. Reword it.
- **Shell calls that drift.** A `cd` persists, so the next `cd floc/apps/web` fails. Inline Python and long quoted `bash -c` lines break on quotes. Use absolute paths; put anything over one line in a scratchpad `.mjs` or `.ps1`. `Glob` a path before `Read` — `floc-core/src/design/tokens.ts` is a file, not a folder.
- **The warning `The "pnpm" field in package.json is no longer read`.** Global npm `pnpm` 10 ran instead of corepack's pinned 9. Harmless, but the overrides applied are the yaml copy. Run `corepack enable` once. Never delete the `package.json` copy — CI's pnpm 9 reads only that one.
- **Port 3000 held by another chat's `floc-web`.** Do not start a second one on 3001. Point the pane at the running server (`preview_start {url: "http://localhost:3000"}`) or ask the user to stop it.
- **A plain string replace on a CRLF file.** Most files here are CRLF, so an LF-keyed match silently finds nothing. Normalise, patch, restore.
- **Editing a skill and expecting it to load.** Claude reads a cached copy. Bump the plugin `version`, run `claude plugin update floc@floc --scope project`, restart the session.

## App

- **A `stop` table, or a lifecycle column.** Both are derived, never stored (rules 3, 4).
- **Treating "no dates" or "no forecast or location" as an error.** Both are normal, silent states (rules 9, 11).
- **A page-specific `loadXTab()` in `server/`.** Write a reusable aggregate read instead.
- **A new write without `isNull(deletedAt)`**, or copying a hard-delete exception without re-reading why it is one (rule 8).
- **A hand-rolled membership check.** Use `requireTripAccess` (rule 5).
- **A hex colour.** Use a token.
- **Guessing a token name from the docs' prose.** The ground is `--paper`, the surface `--sheet`, the hairline `--rule`, the blue `--pen`. "Canvas", "white" and "blue" are descriptions, not variables. `@floc/core/design/tokens` is the list.
- **Editing token values in `globals.css`.** They live in `@floc/core/design/tokens`; `check:tokens` fails the build if the two disagree (#288).
- **A `dark:` variant.** The token is wrong instead.
- **A schema column without applying the new `drizzle/*.sql` to `local.db`.** The migration is written but never applied; dev dies on `no such column`. Use `/floc:schema-change`.
- **An `@/db` import inside `app/`.** SQL lives only in `server/`.
- **Recalculating `expense_split` rows.** They are snapshots (rule 2).
- **Storing a timezone or offset.** Dates are `YYYY-MM-DD` strings (rule 10).
- **Bumping `better-auth` past 1.6.** 1.7 wants an `account.issuer` column the schema lacks, and sign-up returns 500. Pinned `~1.6.30`; moving needs a migration.
- **Calling `requireTripAccess` from a route handler.** `notFound()` throws a Next navigation signal the handler cannot catch. Use `findTripAccess`, which returns `null` (#287).
- **A trip-scoped tRPC procedure on `protectedProcedure`.** Use `tripProcedure`, which resolves access before the body runs (rule 5).
- **Restarting `next dev` after a dependency change without clearing `.next`.** It serves the old module, and the error names the wrong cause.
- **One tRPC mutation per row, in a loop.** On the local file database, parallel write transactions hit `SQLITE_BUSY` and half the rows save. Send the batch as one call, one transaction (#345).

## Mobile

- **`pnpm add` for a package in `floc/apps/mobile`.** It installs npm's latest, rarely what the SDK pins. `react-native-svg@15.14.0` pulled in the Node `buffer` polyfill and every screen went red. Use `/floc:add-mobile-dep` (`npx expo install`, then `--check`).
- **Installing with a dev server up.** The running process holds `node_modules`; pnpm dies on `EPERM ... rename` and rolls back, leaving the dep in `package.json`. Stop servers first.
- **Trusting a mobile `typecheck` run before Metro.** expo-router writes `.expo/types/router.d.ts` at start, so after moving or adding a route the old routes still validate. Start Metro, then typecheck.
- **A killed `expo run:android`** leaves a `node` process on 8081. The next run offers 8082, which the `adb reverse` tunnel does not cover. Answer no; stop the PID from `Get-NetTCPConnection -LocalPort 8081`.
- **Trusting `pnpm --filter floc-mobile android` after adding a config plugin or `google-services.json`.** It reuses the ignored `android/` folder and never re-runs prebuild, so the plugin is missing and push tokens come back null. Run `pnpm --filter floc-mobile exec expo prebuild --platform android --clean` first (#345).
- **Metro dying on `ENOENT: ... watch '...\.next\...'`.** It is watching the web app's stale build — not a mobile problem. `pnpm --filter floc-web run clean:next`.
