# Floc — where each feature lives

Feature → folders, so a search starts in the right place. Paths are from the
repo root. `pnpm fitness` fails when a path here stops existing; when you move
or add a feature folder, change this file in the same commit.

Shared rules and words sit in `@floc/core` (`floc/packages/floc-core/src/`);
SQL sits in `floc/apps/web/src/server/`; the phone reads through `@floc/api`
(`floc/packages/floc-api/src/`).

## A trip, tab by tab

Web routes are under `floc/apps/web/src/app/trip/[id]/`. Phone screens are under
`floc/apps/mobile/app/(app)/(tabs)/trip/`.

| Tab | Web components | Server | Core | Phone components |
|---|---|---|---|---|
| Overview | `floc/apps/web/src/components/trip/overview/` (stops, bookings card, left to sort, map, group, files) | `floc/apps/web/src/server/trips/` | `floc/packages/floc-core/src/trip/overview/` | `floc/apps/mobile/src/components/trip/` |
| Dates | `floc/apps/web/src/components/availability/` | `floc/apps/web/src/server/itinerary/`, `floc/apps/web/src/server/calendar/` | `floc/packages/floc-core/src/dates/` | `floc/apps/mobile/src/components/dates/`, `floc/apps/mobile/src/components/days/` |
| Days | `floc/apps/web/src/components/days/` | `floc/apps/web/src/server/itinerary/` | `floc/packages/floc-core/src/itinerary/` | `floc/apps/mobile/src/components/days/` |
| Ideas | `floc/apps/web/src/components/trip/ideas/` | `floc/apps/web/src/server/ideas/` | `floc/packages/floc-core/src/trip/` | `floc/apps/mobile/src/components/trip/ideas/` |
| Money | `floc/apps/web/src/components/money/` | `floc/apps/web/src/server/money/` | `floc/packages/floc-core/src/money/` | `floc/apps/mobile/src/components/money/` |
| Packing | `floc/apps/web/src/components/packing/` | `floc/apps/web/src/server/packing/` | `floc/packages/floc-core/src/packing/` | `floc/apps/mobile/src/components/packing/` |
| Files | `floc/apps/web/src/components/documents/` | `floc/apps/web/src/server/documents/` | `floc/packages/floc-core/src/documents/` | `floc/apps/mobile/src/components/files/` |
| Notes | `floc/apps/web/src/components/notes/` | `floc/apps/web/src/server/notes/` | `floc/packages/floc-editor/src/` | `floc/apps/mobile/src/components/notes/` |

Bookings and site links: `floc/apps/web/src/components/booking/`,
`floc/packages/floc-core/src/trip/booking/` (links, and your own sites).

## Around the trip

| Area | Web | Phone |
|---|---|---|
| Top bar, trip tabs, account menu, footer | `floc/apps/web/src/components/chrome/`, `floc/apps/web/src/server/chrome/` | `floc/apps/mobile/app/(app)/(tabs)/_layout.tsx` |
| My trips | `floc/apps/web/src/app/trips/`, `floc/apps/web/src/components/trip/` (bars: `components/trip/trips/`; opening a trip: `lib/trip-open/`) | `floc/apps/mobile/app/(app)/(tabs)/trips.tsx` |
| Explore | `floc/apps/web/src/app/explore/` (listing page: Good to know in `components/explore/trip/know-*.tsx`, content in `floc/packages/floc-core/src/trip/explore/know/`), `floc/apps/web/src/components/explore/`, `floc/apps/web/src/server/explore/` | `floc/apps/mobile/src/components/explore/` |
| Profile and globe | `floc/apps/web/src/app/profile/`, `floc/apps/web/src/components/profile/`, `floc/packages/floc-globe/src/` | `floc/apps/mobile/app/(app)/(tabs)/profile.tsx` |
| Friends, inbox | `floc/apps/web/src/components/social/`, `floc/apps/web/src/components/notifications/` | `floc/apps/mobile/src/components/social/` |
| Sign in, invites, guests | `floc/apps/web/src/server/auth/`, `floc/apps/web/src/server/guests/`, `floc/apps/web/src/components/guest/` | `floc/apps/mobile/src/components/auth/` |
| Landing page | `floc/apps/web/src/app/page.tsx`, `floc/apps/web/src/components/landing/` | — |
| Settings, Pro | `floc/apps/web/src/app/settings/`, `floc/apps/web/src/server/billing/` | `floc/apps/mobile/src/components/settings/` |

## Design system

| What | Web | Phone |
|---|---|---|
| House components | `floc/apps/web/src/components/system/ui.tsx`, `floc/apps/web/src/components/system/client-ui.tsx` | `floc/apps/mobile/src/components/system/ui.tsx` |
| Icons | `floc/apps/web/src/components/system/icons/` (one file per area) | `floc/apps/mobile/src/components/system/glyphs.tsx` |
| Token values | `floc/packages/floc-core/src/design/` | same |

## Tooling

| What | Where |
|---|---|
| Mockups (gitignored, `/floc:prototype`) | `floc/wireframe/` pages; shared kit `scripts/wireframe/`, served as `/_house/` by `scripts/wireframe-server.mjs` on :4100 |
| Dev servers for the preview tools | `.claude/launch.json` |
| `pnpm verify`, `pnpm checks`, publish, release and quality gates | `scripts/checks/`, `scripts/delivery/`, `scripts/workspace/`, `scripts/quality/` |
| Web checks (tokens, css, icons, bundle) and db scripts | `floc/apps/web/scripts/` |
| End to end | `floc/apps/web/e2e/`, `floc/apps/mobile/.maestro/` |
| API parity | `scripts/parity/parity.json` |
