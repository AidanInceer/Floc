# finance-planner / apps / prototype 🚧

> **Throwaway prototype.** A rough, fully-interactive draft of the finance-planner
> app — built to explore scope and feel, *not* to become production. Expect to
> delete or heavily rewrite this. It deliberately skips tests, error handling,
> auth, a backend, and real money precision.

The eventual real app is [`../web`](../web/) (still a skeleton). This folder is
the sandbox.

## Run it

From the **repo root** (deps are installed via the pnpm workspace):

```bash
pnpm install
pnpm --filter finance-planner-prototype dev
```

Then open http://localhost:5199.

> No global `pnpm`? Node ships **corepack** — prefix commands with it:
> `corepack pnpm install` then `corepack pnpm --filter finance-planner-prototype dev`.
> (One-time enable: `corepack enable`, after which plain `pnpm` works.)

## What works

Genuinely interactive — everything recomputes live:

- **Home** — the front door. States the actual verdict on the current plan
  ("the tightest month is Oct-26, at £4,581"), computed from the same forecast
  the rest of the app uses, above the full horizon ribbon.
- **Onboarding** — name + cash cushion, seeds buffer/emergency-fund targets.
- **Overview** — spending cash, net worth, tightest month, spare/month, the
  horizon ribbon, accounts, and the top findings.
- **Forecast** — 12-month projection (ribbon + month-by-month table) and an
  illustrative long-run ISA projection.
- **Accounts** — add/edit/remove accounts inline; toggle spendable / ring-fenced.
- **Plan & inputs** — edit income, housing, saving, buffer ceiling, and one-off
  events; the whole forecast updates instantly.
- **Findings** — deterministic rubrics (emergency fund, buffer, runway, ISA
  allowance) + a resilience ladder.

## How it's built

- **Vite + React + TypeScript**, no UI or chart libraries (hand-rolled SVG).
- **`src/domain/`** — a pure [`forecast.ts`](src/domain/forecast.ts) engine that
  ports the source Excel `Cashflow` logic (share-adjusted housing from the
  completion month, bonus month, ISA start, and the cash-sweep to a buffer
  ceiling), plus [`rubrics.ts`](src/domain/rubrics.ts) for guidance.
- **`src/db/`** — a real SQL database behind a driver port: SQLite compiled to
  WebAssembly (sql.js), persisted to IndexedDB, with plain-`.sql` migrations and
  a repository layer. Swapping in hosted Postgres means supplying a different
  driver, not rewriting queries. See [`src/db/README.md`](src/db/README.md).
- **`src/store.tsx`** — React context over the repositories: optimistic in-memory
  state so the forecast recomputes as you type, write-through to SQL. Seed data
  in [`src/seed.ts`](src/seed.ts), loaded on first run.

## Design

Light, ledger-derived, deliberately not a dashboard of floating cards.

- **Rules, not boxes.** Structure is drawn with hairlines and alignment. There
  is exactly one elevated surface in the app (the onboarding sheet), and no
  glass, glow, or decorative gradient.
- **The margin carries the label.** Every section is a `Register` — eyebrow and
  note in a narrow left column, data in the body. That one device replaces card
  headers across every page.
- **Colour is semantic.** Three money states, three colours: spendable is ink,
  ring-fenced is ochre, invested is green. Brick red is reserved for a floor
  breach and nothing else.
- **One signature element**, the horizon ribbon: the whole forecast as a single
  continuous ruled strip, with the buffer floor crossing its full width.
- Type is Newsreader (display), Public Sans (interface), IBM Plex Mono (every
  figure, so columns of money align).

## Deliberate shortcuts (don't port these)

- **In-memory money is a `number` (pounds)** for readability. The database is
  not: every amount is stored as `BIGINT` minor units, and `toMinor`/`fromMinor`
  in [`src/domain/money.ts`](src/domain/money.ts) are the only crossing points.
  Production must push integer pence up through the domain layer too.
- No auth, no server, no tests. The browser database is unencrypted — it holds
  seeded example figures only.
- UK tax/ISA figures are hard-coded placeholders — real values belong in the
  knowledge-base module.

## When done with it

Fold any validated decisions (domain model, forecast behaviour, screen flow)
into the real venture code and docs, then this folder can be deleted.
