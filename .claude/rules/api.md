---
paths:
  - "floc/packages/floc-api/**"
---
# @floc/api — area rules

The tRPC router every non-web client uses. Root rules in [`AGENTS.md`](../../AGENTS.md) still apply.

- Declare procedures and input rules here; reach data only through `FlocPort`. The web app's port is `floc/apps/web/src/server/api-port/`.
- A trip-scoped procedure uses `tripProcedure`, never `protectedProcedure` — it resolves access before the body runs (rule 5).
- One mutation per row in a loop hits `SQLITE_BUSY` on the local file database and half the rows save. Send a batch as one call, one transaction (#345).
- **New procedure → a line in [`parity.json`](../../scripts/parity/parity.json):** does the phone have it, and if not, why. `pnpm parity --fix` writes the mechanical half; you write the `why`. Rules: [`parity.ts`](../../floc/packages/floc-api/src/parity.ts).
