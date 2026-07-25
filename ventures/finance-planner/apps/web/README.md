# finance-planner / apps / web

**Next.js** frontend for the finance-planner venture. **Skeleton only — no app
code yet.**

## Planned

- App Router, React, Tailwind CSS.
- Screens: onboarding, dashboard, accounts, cash-flow, advice, scenarios.
- Typed API client to the venture's API (`../../services/api`), ideally via the
  shared [`api-client`](../../../../shared/packages/api-client/) package.
- UI from the hub's [`ui-kit`](../../../../shared/packages/ui-kit/) and
  [`design-system`](../../../../shared/packages/design-system/).

## Design reference

Static mockups live in [`../../docs/mockups/`](../../docs/mockups/). Open
`docs/mockups/index.html` in a browser.

## Rules

- Follow the venture [`CLAUDE.md`](../../CLAUDE.md) and hub conventions.
- Money is formatted for display only; never do money arithmetic in the UI —
  that belongs in [`../../services/domain`](../../services/domain/) via the API.
