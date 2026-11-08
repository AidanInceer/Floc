---
paths:
  - "floc/apps/mobile/**"
---
# floc-mobile — area rules

Expo app for iOS and Android. Own UI and version, same [visual language](../../docs/design/visual-language.html). Root rules in [`AGENTS.md`](../../AGENTS.md) still apply. Shipping: [`SHIPPING.md`](../../floc/apps/mobile/SHIPPING.md), [`STORE.md`](../../floc/apps/mobile/STORE.md).

## UI

- House components: `src/components/system/ui.tsx` and `glyphs.tsx`. Use them before you write markup.
- The notes editor (`@floc/editor`) and globe (`@floc/globe`) run in an Expo DOM component, not native views.
- Surface rules: [on a phone, cut it back](../../docs/design/visual-language.html#on-a-phone); [drawn tighter](../../docs/design/index.html#the-app).

## Dependencies

- Add or upgrade a package only through `/floc:add-mobile-dep`: `npx expo install`, then `--check`. Never `pnpm add` — it installs npm's latest, rarely what the SDK pins, and a mismatch fails at runtime as a red screen (`react-native-svg@15.14.0` pulled in the Node `buffer` polyfill once).
- Stop dev servers before an install. A running process holds `node_modules`; pnpm dies on `EPERM ... rename` and rolls back, leaving the dep in `package.json`.

## Routes and typecheck

- New or moved route: typecheck *after* Metro starts. expo-router rewrites `.expo/types/router.d.ts` at start; before that, typecheck passes against the old routes.

## Maestro

- Flows in [`.maestro/`](../../floc/apps/mobile/.maestro) run against `/floc:run` with scenario A seeded. Not in CI or `verify` — run by hand: `pnpm --filter floc-mobile maestro`.
- One flow, `app.yaml`: wipe once, sign in once through the dev sign-in button, then walk the app. Extend it; do not add flows that relaunch.
- Target a control by `testID` (`id:` in the flow).

## Pitfalls

- **One tRPC mutation per row, in a loop.** Parallel write transactions hit `SQLITE_BUSY` on the local database and half the rows save. Send the batch as one call ([API rules](api.md)).

- **A killed `expo run:android`** leaves a `node` process on 8081. The next run offers 8082, which the `adb reverse` tunnel does not cover. Answer no; stop the PID from `Get-NetTCPConnection -LocalPort 8081`.
- **`pnpm --filter floc-mobile android` after adding a config plugin or `google-services.json`** reuses the ignored `android/` folder and never re-runs prebuild, so the plugin is missing and push tokens come back null. Run `pnpm --filter floc-mobile exec expo prebuild --platform android --clean` first (#345).
- **Metro dying on `ENOENT: ... watch '...\.next\...'`** means it is watching the web app's stale build — not a mobile problem. `pnpm --filter floc-web run clean:next`.
