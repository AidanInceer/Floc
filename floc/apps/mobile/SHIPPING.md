# Shipping the phone apps (ticket 290)

Push to `main` deploys the website. It must **not** mean the same thing here: a
store review takes days, and a rule that is not written down defaults every
change to the slow path.

So there are two ways a change reaches a device, and exactly one question
decides which.

## The question

**Does the change alter native code, or what the OS is told about the app?**

It is a **native change** — needing a full build and a store submission — if it:

- adds or upgrades a package containing native code (anything with an iOS or
  Android target, not just JavaScript);
- changes a permission, an entitlement, or the bundle identifier;
- changes the app icon, the splash screen, or the app name;
- bumps the Expo SDK;
- changes anything in `app.json` that lands in the native manifest — `scheme`,
  `plugins`, `ios.*`, `android.*`.

Everything else — screens, copy, styling, tokens, API calls, business rules
pulled in from `@floc/core` — is **JavaScript-only** and ships by EAS Update.

## The line an update may not cross

An EAS Update may fix, refine or extend what the app already does. It may
**never change what the app is for**. Both stores treat that as sideloading a
different app, and both are right to. If a change would need a new store
description, it needs a new build.

## Versioning

`floc/apps/mobile/package.json` carries its **own** version, separate from
`floc/apps/web/package.json`. The commit convention keeps bumping the web
version on every ticket; this one moves only when a build is submitted, and the
build number increments per submission (`autoIncrement` in `eas.json` does it).

`runtimeVersion` follows `appVersion`, so an update can only ever land on a
build compiled from compatible native code. That is the safety net under the
question above: get the answer wrong in the "JavaScript-only" direction and the
update is refused by the device rather than crashing on it.

## Running it

```bash
# a JavaScript-only change, live in minutes
eas update --branch production --message "0.79.6 #290: fix the money tab's empty state"

# a native change — days, and a store review
eas build   --platform all --profile production
eas submit  --platform all --profile production
```

Store builds are triggered by hand, never by a push. There is no workflow that
submits, and adding one is its own decision.
