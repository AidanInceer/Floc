# Everything the stores demand that is not code (ticket 292)

None of this is a build failure. All of it is a submission failure, found late,
after the build already took an hour. So it is written down before the first
submission rather than discovered during it.

Nothing here can be done from this repository — every item is an account, a
console form, or an asset. That is the point of the list.

## Accounts, before anything else

| What | Cost | Lead time |
|---|---|---|
| Apple Developer Program | £79/year | Hours to ~2 days to verify |
| Google Play Developer | $25 once | Up to a few days; identity verification is now mandatory |
| Expo / EAS account | Free tier is enough to start | Immediate |

Apple bills annually and the apps are pulled the day it lapses. Google's
identity check has refused people for a mismatched address; do it early.

## Identifiers, fixed forever once submitted

- Bundle identifier / package name: `com.floc.app` (both platforms).
- Deep-link scheme: `floc://`.
- Neither can be changed after the first submission. Changing one means a new
  app listing and every installed copy stays on the old one.

`app.json` already carries both, and `eas init` has written the real
`extra.eas.projectId`.

## Assets

| Asset | Size | Where |
|---|---|---|
| App icon | 1024×1024, no alpha, no rounded corners | `assets/icon.png` |
| Android adaptive icon | 1024×1024 foreground, safe zone centred | `assets/adaptive-icon.png` |
| Splash | 1284×2778 works everywhere | `assets/splash.png` |
| iPhone screenshots | 6.7" (1290×2796), 3–10 of them | App Store Connect |
| iPad screenshots | 12.9" (2048×2732) — required, `supportsTablet` is true | App Store Connect |
| Android screenshots | 2–8, min 320px on the short edge | Play Console |
| Play feature graphic | 1024×500 | Play Console |

The icon, adaptive icon and splash are **generated** by
`scripts/make-icons.mjs` from the wordmark's three chevrons on `--paper` — the
mark alone, no lettering, because the wordmark is unreadable at 48dp. Rerun the
script rather than editing the PNGs. Not a screenshot, and no emoji.

Screenshots must show the app as submitted. Both stores reject a shot of a
screen the reviewer cannot reach.

## The legal pages, which must exist and be reachable

Both stores require a **live, public** privacy policy URL before review, and
Apple additionally requires terms if there is any paid tier.

- Privacy policy: `https://floc.app/privacy`
- Terms: `https://floc.app/terms`
- Support URL: `https://floc.app/support` (Apple requires one; a mailto is not
  enough)

Ticket 270 owns writing them. This ticket only records that submission is
blocked until they return 200 to a reviewer who is not signed in.

## Data safety and privacy declarations

Both stores ask, in their own form, what the app collects. Floc's honest
answers, from the schema:

| Data | Collected | Why | Linked to identity |
|---|---|---|---|
| Email address | Yes | Account, and the invite mail | Yes |
| Name | Yes | Shown on the roster | Yes |
| Photos | Yes, if uploaded | Trip documents | Yes |
| Location | **No** | The map takes a named place, not a fix | — |
| Contacts | **No** | Invites go by email typed in, never by import | — |
| Advertising / analytics | **No** | There is none (out of scope, v1) | — |
| Purchase history | Yes, via Stripe | Pro subscription | Yes |

A declaration that does not match observed behaviour is the most common cause
of a second-round rejection. If #227 (live location) or #167 (photos) ships,
this table changes in the same slice.

## Payments — the one that gets apps rejected

Pro is bought **on the website**, not in the app. The app may show what Pro is;
it must not link to a purchase flow, and must not steer the user to the site to
pay.

Apple's rule 3.1.1 forbids both the link and the nudge; Google's Play Billing
policy is now equivalent. The app already reflects this — Pro is visible and
not purchasable (#291) — and it must stay that way unless someone decides to
add real in-app purchase, which is its own decision and its own 15–30% cut.

## Age rating

Both stores make you answer a questionnaire. Floc has user-generated content
that other members can see (notes, trip names, photos), which means:

- Apple: 12+ at minimum, because UGC exists.
- Google: content rating via IARC, and the UGC box must be ticked.
- Both then require a way to **report** objectionable content and **block** a
  user. Neither exists yet. That is a real gap for a submission and should be a
  ticket before the first one, not after the first rejection.

## Review notes

Reviewers cannot sign up — verification needs an inbox. Supply a demo account
in the submission notes, on a trip with dates, an itinerary and expenses on it,
or the reviewer sees empty states and rejects for "incomplete functionality".

## Order of operations

1. Developer accounts (slowest, do first).
2. `eas init` — done.
3. Legal pages live (#270).
4. Icon and splash — done. Screenshots still to do.
5. `eas build --profile preview` — install on a real device, check it works.
6. Store listings, data safety, age rating.
7. `eas build --profile production`, then `eas submit`.
