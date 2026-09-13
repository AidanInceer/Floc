# learnings.md — common agent pitfalls

Things that bite. Read before editing.

## Hub / repo

- Editing a `.md` doc source that doesn't exist — HTML *is* the doc, edit directly.
- Adding a `docs/` page without a `nav.js` `TREE` line — silently unreachable.
- `fetch`/ES modules in a docs page — breaks on `file://`, use `<script src>`.
- npm-style `"workspaces"` array — workspaces live in `pnpm-workspace.yaml` only.
- PowerShell commit here-string where `@'`/`'@` aren't alone on their lines — `@` leaks into subject. Verify `git log -1 --format=%s`.
- Running a bare `pnpm build`/`fitness` with dev server up — corrupts `.next`. `pnpm verify` is safe (it builds to `.next-verify`); for the others stop dev first, check `preview_list`, not `ps`.
- Skipping `CLAUDE.md` — it holds the real non-negotiables. One file at the root; there is no venture-level copy.
- Inventing/borrowing a `Closes` issue number — shuts someone else's issue.
- A brace glob in an `eslint.config.mjs` — the `brace-expansion` security pin breaks `minimatch@3`'s expander, and ESLint dies with "expand is not a function" naming neither. List the extensions separately.
- `*/` inside a block comment (a glob like `**/*.ts` in prose) — closes the comment early; reword it.
- Editing a source file with a plain string replace — most files here are CRLF, so an LF-keyed match silently finds nothing. Normalise, patch, restore.

## Venture / app

- Adding a `stop` or lifecycle-state table/column — both derived, not stored (rules 3–4).
- Treating "no dates" or "no forecast/location" as an error path — normal silent states (rules 9, 11).
- Writing a page-specific `loadXTab()` in `server/` instead of a reusable aggregate read.
- Forgetting `isNull(deletedAt)` on a new write, or copying a hard-delete exception without re-reading why it's one.
- Hand-rolling a membership check instead of `requireTripAccess`.
- Reaching for a hex colour instead of a token.
- Guessing a token name from the docs' prose — the ground is `--paper`, the surface `--sheet`, the hairline `--rule`, the blue `--pen`. "Canvas", "white" and "blue" are descriptions, not variables. `globals.css` is the list.
- Adding a schema column without running the new `drizzle/*.sql` against `local.db` — the migration is written, never applied; dev dies on `no such column`.
- `@/db` import inside `app/` — SQL only in `server/`.
- A `dark:` variant — token is wrong instead.
- Recalculating `expense_split` rows — they're snapshots.
- Persisting a timezone/offset — dates are `YYYY-MM-DD` strings.
- Editing token values in `globals.css` — they live in `@floc/core/tokens` now; `check:tokens` fails the build if the two disagree (#288).
- Bumping `better-auth` past 1.6 — 1.7 wants an `account.issuer` column the schema lacks, and signup 500s. Pinned `~1.6.30`; moving needs a migration.
- Calling `requireTripAccess` from a route handler — `notFound()` throws a Next navigation signal it cannot catch. Use `findTripAccess`, which answers `null` (#287).
- Adding a trip-scoped tRPC procedure on `protectedProcedure` — use `tripProcedure`, which resolves access before the body runs (rule 5).
- Restarting `next dev` after a dependency change without clearing `.next` — it serves the old module and the error names the wrong cause.
- `pnpm add` for a native/Expo package in `floc/apps/mobile` — installs whatever npm calls latest, which is rarely what the SDK pins. `react-native-svg@15.14.0` imported the Node `buffer` polyfill and every screen went red. Always `npx expo install <pkg>`, and `npx expo install --check` before believing a version.
- `pnpm add` with a dev server up — the running process holds `node_modules`, pnpm dies on `EPERM ... rename` and rolls the install back with the dep still in `package.json`. Stop servers first.
- Trusting a mobile `typecheck` that ran before Metro — expo-router writes `.expo/types/router.d.ts` at start, so after moving or adding a route the old union still validates. Start Metro, then typecheck again.
- A killed `expo run:android` leaves a `node` orphan on 8081; the next run offers 8082, which the `adb reverse` tunnel does not cover. Answer no, kill the PID from `Get-NetTCPConnection -LocalPort 8081`.
- Trusting `pnpm --filter floc-mobile android` after adding a config plugin or `google-services.json` — it reuses the ignored `android/` folder and never re-runs prebuild, so the plugin is missing and push tokens silently come back null. Run `pnpm --filter floc-mobile exec expo prebuild --platform android --clean` first (#345).
- Firing one tRPC mutation per row in a loop — on the local file database parallel write transactions hit `SQLITE_BUSY` and half the rows save. Send the batch as one call, one transaction (#345).
- Metro dying on `ENOENT: ... watch '...\.next\...'` — it is watching the web app's stale build, not a mobile problem. `pnpm --filter floc-web run clean:next`.
