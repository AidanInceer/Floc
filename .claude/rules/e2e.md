---
paths:
  - "floc/apps/web/e2e/**"
---
# Web end to end — area rules

Playwright, run with `pnpm --filter floc-web e2e`. Root rules in [`AGENTS.md`](../../AGENTS.md) still apply.

- Needs a build in `.next-verify` (`pnpm verify` makes one) and serves it on :3100.
- Seeds its own database, never `local.db`.
- Each person signs in once, in [`auth.setup.ts`](../../floc/apps/web/e2e/auth.setup.ts). Production allows 3 sign-ins per 10 s; a spec that signs in again gets rate-limited.
