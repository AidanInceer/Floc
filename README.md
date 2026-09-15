<img src="docs/brand/floc-logo.svg" alt="floc" width="132" height="28">

# floc — group-travel planning, sorted

Planning a trip with friends means one chat, five tabs, a spreadsheet and
nobody sure who owes who. **floc** is one shared place for the whole trip.

**Status:** pre-MVP. One venture, one web app, one mobile app.

## What it does

- **Where** — pick places together, vote on ideas, see the route on a map.
- **When** — everyone marks their availability; the dates fall out of it.
- **The days** — a day-by-day itinerary, built from the places you picked.
- **The money** — log expenses, split them, see who owes who at the end.
- **The stuff** — shared notes, documents and packing lists.

A trip has no lifecycle and no setup wizard. Add what you know; the app grows
around it. Dates can stay unset forever and nothing breaks.

## The shape of it

```
floc/
├── apps/web/       Next.js App Router · Turso (libSQL) · Drizzle · Better Auth
├── apps/mobile/    Expo — iOS + Android
├── packages/
│   ├── floc-core/  domain rules (money, dates, calendar, packing) + design tokens
│   └── floc-api/   the tRPC router every non-web client reads a trip through
└── wireframe/      throwaway HTML explorations
docs/               local HTML docs site — open docs/index.html off disk
```

pnpm workspaces + Turborepo.

## Run it

```bash
pnpm install
pnpm dev
pnpm verify   # everything CI runs — stop the dev server first
```

## Read next

- [`CLAUDE.md`](CLAUDE.md) — the rules of the codebase, hub and product together
- [`docs/index.html`](docs/index.html) — all documentation
- [approach](docs/design/approach.html) · [visual language](docs/design/visual-language.html) · [architecture](docs/architecture/architecture.html) · [ERD](docs/architecture/data-model/erd.html)
- [`learnings.md`](learnings.md) — pitfalls already paid for

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`…).
- Secrets never in the repo.
- British English, sentence case, no emoji, colours from tokens only.
