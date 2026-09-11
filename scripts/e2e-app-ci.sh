#!/usr/bin/env bash
# The phone app's Maestro flows on the CI emulator, against a seeded web server
# on 3000 and Metro on 8081 — the two ports `adb reverse` carries to the device.
set -euo pipefail
cd "$(dirname "$0")/.."

node floc/apps/web/e2e/serve.mjs 3000 --dev >/tmp/e2e-web.log 2>&1 &
(cd floc/apps/mobile && CI=1 EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start --port 8081 >/tmp/e2e-metro.log 2>&1) &

wait_for() {
  for _ in $(seq 1 90); do
    curl -sf -o /dev/null "$1" && return 0
    sleep 2
  done
  echo "$1 never answered"
  tail -50 /tmp/e2e-web.log /tmp/e2e-metro.log
  return 1
}
wait_for http://localhost:3000/api/auth/get-session
wait_for http://localhost:8081/status

adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
adb install -r floc/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk

maestro test floc/apps/mobile/.maestro
