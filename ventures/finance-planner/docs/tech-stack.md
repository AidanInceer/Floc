# Tech stack

Choices optimised for: a solo builder now, modular/expandable later, financial
correctness, and strong AI integration.

| Concern | Choice | Why |
|---|---|---|
| Repo | **pnpm workspaces + Turborepo** | One place for web, API, shared domain; fast, cached builds; clean module boundaries. |
| Language | **TypeScript everywhere** | One type system spanning the finance domain from DB to UI; fewer boundary bugs. |
| Web | **Next.js (App Router) + React + Tailwind** | Fast to build, great for both the static mockups now and the real app later; SSR for a snappy dashboard. |
| API | **NestJS** | **Module-per-domain by design** — directly expresses the "modular & expandable" goal. DI, guards (auth), pipes (validation) fit a finance app. |
| DB | **PostgreSQL + Prisma** | Relational integrity for money/ledgers; typed queries; easy migrations. |
| Domain logic | **Framework-free `services/domain`** | Pure, deterministic, unit-tested calculation independent of web/API. |
| Money | **integer minor units / Decimal** | Never floats for money. |
| Open banking | **Provider-abstracted** (GoCardless Bank Account Data / TrueLayer) | UK coverage incl. Monzo/Revolut/Barclays; swap providers behind one interface. |
| Auth | **Sessions (httpOnly cookies) + TOTP 2FA** | Standard, secure, no third-party identity dependency for a personal tool. |
| AI | **Anthropic Claude** | Categorisation, narrative advice, and RAG Q&A over knowledge bases; structured outputs. |
| Validation | **Zod** | Runtime validation at every trust boundary (API input, provider payloads). |
| Testing | **Vitest** (domain/unit) + **Playwright** (e2e later) | Fast unit loop for the calc core; browser tests when there's an app. |
| Lint/format | **ESLint + Prettier** | Consistency. |

## Deferred / optional (add when justified)

- Background jobs: start with a simple scheduler; add a queue (BullMQ/Redis) if
  sync volume warrants.
- Vector store for RAG: begin with curated structured knowledge; add embeddings
  if free-text gov guidance needs semantic search.
- Charts: a lightweight React charting lib for the cash-flow visual.

## Why not alternatives (brief)

- **Python/FastAPI for the engine?** Tempting for modelling, but keeping one
  TypeScript type system across the finance domain (DB→API→UI) reduces boundary
  bugs for a solo builder. Revisit if heavy quant/ML appears.
- **Full-stack Next only (no separate API)?** Fine early, but a dedicated NestJS
  API keeps modules, background sync, and integrations cleanly separated as the
  system grows.

See [`adr/0002-monorepo-and-stack.md`](adr/0002-monorepo-and-stack.md).
