# Architecture decision records — Waypoint

Design decisions for the group-travel planning venture. Format and conventions:
[0001](0001-record-architecture-decisions.md).

Everything here is **Proposed** unless marked otherwise — this venture is a
design canvas, not a codebase.

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-product-thesis-and-scope.md) | Product thesis — one app for the whole trip, group-first | Proposed |
| [0003](0003-product-name.md) | Product name — candidates and criteria | Proposed |
| [0004](0004-borrowed-models.md) | What we borrow from Splitwise, Polarsteps and Notion | Proposed |
| [0005](0005-trip-lifecycle-stages.md) | The trip lifecycle — ten stages, one object | Proposed |
| [0006](0006-notes-as-the-source-of-truth.md) | Notes are the source of truth; the AI drafts, the group decides | Proposed |
| [0007](0007-money-ledger-not-payments.md) | Money — a shared ledger, not a payments business | Proposed |
| [0008](0008-accounts-2fa-and-public-profiles.md) | Accounts, 2FA, and the public traveller profile | Proposed |
| [0009](0009-third-party-integrations.md) | Third-party integrations — deep link out, never resell | Proposed |
| [0010](0010-feature-backlog-and-mvp-cut.md) | Feature backlog, and the MVP cut | Proposed |
| [0011](0011-landing-teaches-one-real-trip.md) | The landing page teaches by walking one real trip | Proposed |
| [0012](0012-visual-direction-and-prototypes.md) | Visual direction — four prototypes, one structure | Proposed |
| [0013](0013-hybrid-visual-direction.md) | Hybrid visual direction — Paper structure, Wanderlog mechanics | Proposed |

## Open questions

- **The name.** [0003](0003-product-name.md) shortlists Cairn, Convoy, Someday,
  Flock. Nothing else should be branded until this lands.
- ~~**The visual direction.**~~ Settled as a hybrid in
  [0013](0013-hybrid-visual-direction.md) — Paper's voice on Wanderlog's
  mechanics. Density at nine people and eight days is still untested.
- **Monetisation.** Subscription vs. referral vs. both is unaddressed. Payments
  are ruled out ([0007](0007-money-ledger-not-payments.md)), which narrows it.
- **Geography for v1.** Europe-first is assumed throughout but never decided.
- **Who the first hundred groups are** — and how they're reached.
