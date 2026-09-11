---
name: run
description: Bring up the whole Floc development loop — Pixel 9 emulator, floc-web dev server, Metro, and the mobile app — then confirm each piece is actually answering. Use when the user says /floc:run, "start everything", "launch the emulator", or wants to test a feature on the phone.
---

# run

One command up, then **prove it works**. The script is the easy half; the
checks are the half that saves the session.

## Process

### 1. Servers in this window

A `.ps1` cannot open a terminal inside the Claude app, so the two servers come
up through `.claude/launch.json` instead — their logs are then readable with
`preview_logs` rather than stranded in a window nobody is watching.

Call `preview_start` twice: `floc-web` (port 3000) and `floc-metro` (port
8081). Both are idempotent — an already-running server is reused.

### 2. Emulator, tunnels, app

The rest has no Claude tool, so it stays in the script. Run it in the
**background** — booting a cold AVD takes minutes and will otherwise block:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -SkipWeb -SkipMetro
```

`-SkipWeb -SkipMetro` is what stops it starting a second copy of the servers
Claude already owns. Flags: `-SkipEmulator`, `-SkipApp`, `-Avd <name>`.

For the user's own use outside Claude, `pnpm run:all` does all four in two
separate PowerShell windows.

### 3. Verify, do not assume

A started process is not a working loop. Check all three:

```bash
curl -s -o /dev/null -w 'web=%{http_code}\n' http://localhost:3000/api/auth/get-session
curl -s -o /dev/null -w 'metro=%{http_code}\n' http://localhost:8081/status
"$ANDROID_HOME/platform-tools/adb.exe" reverse --list
```

Want `web=200`, `metro=200`, and **both** `tcp:3000` and `tcp:8081` listed.

### 4. Look at the screen

The emulator is readable. Capture it and read the PNG:

```bash
"$ANDROID_HOME/platform-tools/adb.exe" exec-out screencap -p > shot.png
```

Write it to the scratchpad, not the repo. Drive the app with
`adb shell input tap <x> <y>` and `adb shell input text <string>` to walk a
feature end to end rather than asking the user to do it.

### 5. Sign in without typing a password

Both surfaces have a no-password door for the local test account. It only
answers when the web app is not production **and** both `FLOC_DEV_USER_EMAIL`
and `FLOC_DEV_USER_PASSWORD` are set in `floc/apps/web/.env` — otherwise it
404s, so a 404 here means the variables are missing, not that the route broke.

Web — POST it and reload the pane:

```bash
curl -s -o /dev/null -w 'sign-in=%{http_code}
' -X POST http://localhost:3000/api/dev/sign-in
```

In the browser pane, do it from the page instead so the cookie lands on that
origin: `javascript_tool` → `await fetch('/api/dev/sign-in',{method:'POST'})`,
then reload.

App — the sign-in screen has a **"Sign in as the dev user"** button on a dev
build. Tap it with `adb shell input tap`. It fetches the credentials from the
same route and signs in down the normal path, so the token lands in the
keychain as usual.

If the route 404s, tell the user to add the two variables and restart the web
server. The account has to already exist — signing up is theirs to do.

### 6. Report

Say what is up, what is not, and the one next action. Nothing else.

## Gotchas

- **`adb reverse` dies with the emulator.** Not with Metro, not with a reload.
  Re-running `pnpm run:all` re-asserts it.
- **The app must be built once** before this works:
  `pnpm --filter floc-mobile android`. Needs `JAVA_HOME` on **JDK 17** —
  JDK 25's restricted-native-access warning hides the real CMake error. If the
  daemon was already up on the wrong JDK, `cd floc/apps/mobile/android;
  .\gradlew.bat --stop` first.
- **Env changes need a Metro restart**, not a reload. `EXPO_PUBLIC_*` is baked
  into the bundle at build time. Confirm one landed by grepping the served
  bundle rather than guessing.
- **Stop the servers before anything that builds.** `verify`, `build` and
  `fitness` write `.next`, which `next dev` owns. Use `preview_stop` for
  servers Claude started, `pnpm run:stop` for ones the user started.
- **Never run the script in the foreground.** A cold boot takes minutes and
  the tool call dies before the emulator is up.
- **`adb` writes to stderr on a normal day** (its daemon-start notice), which
  `$ErrorActionPreference = "Stop"` treats as fatal. That is why every adb call
  in the script goes through `Invoke-Native`.
- **The phone is not the host.** `localhost` on the device means the device.
  The reverse tunnel is what makes `EXPO_PUBLIC_API_URL=http://localhost:3000`
  in `floc/apps/mobile/.env.local` the right value; the LAN address needs an
  inbound firewall rule and an administrator.
- **A sign-in failure is not always a wrong password.** The screen tells the
  two apart now — read the message before debugging credentials.

## After adding a mobile dependency

The loop above assumes the app is already built. A new package breaks that
assumption in three places, so do these in order and the rebuild is boring:

1. **`npx expo install <pkg>`, servers stopped.** Not `pnpm add` — Expo pins a
   version per SDK and npm's latest is usually a different one. The mismatch
   does not fail the install; it fails at runtime, as a red screen naming a
   module the bundle has no business needing (`react-native-svg@15.14.0` asked
   for `buffer`). A live dev server holds `node_modules` and the install dies
   on `EPERM ... rename`, rolling back with the dep left in `package.json`.
2. **Rebuild if it has native code.** `pnpm --filter floc-mobile android`, on
   JDK 17. A JS-only package needs only a Metro restart.
3. **Typecheck after Metro is up, not before.** Adding or moving a route makes
   expo-router rewrite `.expo/types/router.d.ts` at Metro start. Run it early
   and it validates against the old union and passes on paths that no longer
   exist.

Two failures that look worse than they are:

- `ENOENT ... watch '...\.next\...'` at Metro start — Metro is watching the web
  app's stale build. `pnpm --filter floc-web run clean:next`.
- "Port 8081 is being used" — a killed `expo run:android` left a `node` orphan.
  Say **no** to 8082; the `adb reverse` tunnel only covers 8081. Find it with
  `Get-NetTCPConnection -LocalPort 8081 -State Listen` and stop that PID.
