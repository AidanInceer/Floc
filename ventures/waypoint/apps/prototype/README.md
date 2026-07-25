# waypoint-prototype

A **throwaway** working prototype of Waypoint — the ADR 0010 MVP cut, built to
be clicked rather than read. Vite + React + TypeScript, no backend.

```bash
corepack pnpm --filter waypoint-prototype dev
```

## What's real

Everything on this list actually works; state lives in `localStorage` under
`waypoint.prototype.v1` and nowhere else.

| MVP item (ADR 0010) | Where |
|---|---|
| Idea board, up / don't mind / block, a block needs a reason | `pages/Decide.tsx` |
| Availability grid → lock a window | `pages/Decide.tsx` |
| Stops with nights, typed legs, and the route line | `pages/Route.tsx` |
| Day list, free-form notes on any event or on the trip | `pages/Days.tsx` |
| Shared ledger: add a cost, split it, balances, simplified settle-up | `pages/Money.tsx`, `money.ts` |
| "Waiting on you" across every trip, plus nudge | `store.tsx` (`chores`), `pages/Chase.tsx` |
| Create a trip | `pages/Trips.tsx` |

## What's faked

Accounts and invites (you are always Sam), weather, flights, calendar sync, AI
route drafting — all deliberately out of v1. Nudges mark themselves sent; no
message goes anywhere.

## Rules worth keeping if this is ever rebuilt

- **Money is integer minor units.** `money.ts` never sees a float, and
  `splitEvenly` gives the remainder pennies away so parts always sum to the
  total. Settle-up is a greedy debtor/creditor match — at most n−1 transfers.
- **Nothing moves funds.** "Mark as paid" writes a ledger line (ADR 0007).
- **Routing is hash-based and there are no anchors.** In-page tabs (days,
  stops) are component state, so clicking one never moves the scroll position.
- **Light by default**, dark opt-in, stored separately from the trip data.

## Visual direction

Paper × Wanderlog — see [ADR 0013](../../docs/adr/0013-hybrid-visual-direction.md).
The four original single-file prototypes are still in
[`../../wireframe/`](../../wireframe/) and are not part of the workspace.
