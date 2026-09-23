---
name: add-mobile-dep
description: Add or upgrade a package in the Floc Expo app (floc/apps/mobile) at the version the SDK pins, then rebuild what the change needs — Metro restart, prebuild, or native rebuild. Use when the user says /floc:add-mobile-dep, "install X in the app", "add a native module", "upgrade an Expo package", or when a mobile red screen names a module after a dependency change.
---

# add-mobile-dep

The install is the easy part. What bites is the version and the rebuild.

## 1. Stop the servers

A running Metro or `floc-web` holds `node_modules`. The install then dies on
`EPERM ... rename` and rolls back, but leaves the dep in `package.json`.

Stop what Claude started with `preview_stop` (see `preview_list`). For servers
the user started: `pnpm run:stop`.

## 2. Install with Expo, never `pnpm add`

```bash
cd floc/apps/mobile; npx expo install <pkg>
```

Expo pins one version per SDK. npm's latest is usually a different one, and
the mismatch does not fail the install — it fails at runtime as a red screen
naming a module the bundle should not need (`react-native-svg@15.14.0` pulled
in the Node `buffer` polyfill).

Then check every Expo package still matches the SDK:

```bash
cd floc/apps/mobile; npx expo install --check
```

Do not trust a version until `--check` is clean.

## 3. Rebuild what the package needs

| The package | Do |
|---|---|
| JavaScript only | Restart Metro. |
| Has native code | `pnpm --filter floc-mobile android` (JDK 17). |
| Adds a config plugin to `app.config.js`, or needs `google-services.json` | `pnpm --filter floc-mobile exec expo prebuild --platform android --clean`, then `pnpm --filter floc-mobile android`. |

The plain `android` build reuses the ignored `android/` folder and never
re-runs prebuild. A new config plugin is then silently missing — push tokens
came back null this way (#345).

On JDK 25 the restricted-native-access warning hides the real CMake error. If
Gradle's daemon started on the wrong JDK: `cd floc/apps/mobile/android;
.\gradlew.bat --stop`, then build again.

## 4. Bring the loop back and typecheck

`/floc:run` brings web, Metro, the emulator and the app back up and proves
each answers.

Typecheck **after** Metro is up:

```bash
pnpm --filter floc-mobile typecheck
```

Metro start rewrites `.expo/types/router.d.ts`. Before that, typecheck passes
against the old routes.

## 5. Record it

- A native module or config change means the next phone release is an EAS
  Build and store review, not an EAS Update — see
  [`SHIPPING.md`](../../../../floc/apps/mobile/SHIPPING.md). Say so in the
  report.
- A new outside service or permission → the
  [multi-platform](../../../../docs/architecture/multi-platform.html) page and,
  if it touches personal data, [security](../../../../docs/architecture/security.html).

## Failures that look worse than they are

- `ENOENT ... watch '...\.next\...'` at Metro start — Metro is watching the web
  app's stale build. `pnpm --filter floc-web run clean:next`.
- "Port 8081 is being used" — a killed `expo run:android` left a `node`
  process. Answer **no** to 8082 (the `adb reverse` tunnel covers 8081 only),
  find it with `Get-NetTCPConnection -LocalPort 8081 -State Listen`, and stop
  that PID.

## Report

Package and version, `--check` result, which rebuild ran, typecheck result,
and whether the next phone release needs a store build. Nothing else.
