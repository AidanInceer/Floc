# CLAUDE.md — shared/

**Foundation code inherited by every venture.** Treat this area as a set of
public contracts. Applies on top of the hub [`../CLAUDE.md`](../CLAUDE.md).

## What belongs here

Code reused (or clearly reusable) by **2+ ventures**: UI (`design-system`,
`ui-kit`), cross-cutting `shared-types` / `shared-utils`, the `api-client`, plus
reusable `infra-modules` and `data-modules`. Venture-specific code does **not**
belong here — keep that in `ventures/<name>/`.

## Rules

1. **Backwards compatibility matters.** A change here can break every venture.
   Version deliberately; document breaking changes; prefer additive changes.
2. **No venture-specific logic.** Nothing here may know about a particular
   venture. If it does, it belongs in that venture.
3. **Stable, minimal public surface.** Export intentionally; keep internals
   private.
4. **Framework discipline.** `shared-utils` and `shared-types` stay framework-free.
   UI packages own their peer-deps (React, etc.) rather than pinning ventures.
5. **Test the contracts.** Shared code carries its own tests — bugs here
   multiply across ventures.

## Before adding something here

Ask: *is this genuinely reused, or just might-be?* Premature sharing is as
costly as duplication. When unsure, start it in one venture and promote it here
once a second venture needs it.
