# 1. Record architecture decisions

Date: 2026-07-25

## Status

Accepted

## Context

This venture is at the design-canvas stage: a set of wireframes, a product
thesis, and a large pile of feature ideas that need capturing before they are
cut down. Decisions made now (what the product is, what it refuses to be, which
third parties it leans on) will be expensive to revisit once code exists, and
they are the kind of decision that gets silently forgotten and re-argued.

## Decision

Use lightweight ADRs, one file per decision, numbered and dated, in
`ventures/waypoint/docs/adr/`. Format follows the hub convention already used by
`finance-planner`: **Context → Decision → Consequences**, with an explicit
**Status** (Proposed · Accepted · Superseded by NNNN).

At this stage most ADRs will be **Proposed** — they record a considered position,
not a commitment. An ADR moves to Accepted when it survives contact with a build.

## Consequences

- Product-shape decisions are written down while the reasoning is fresh.
- "Why don't we just…" questions have an address.
- Cost: ADRs must be superseded rather than edited once Accepted, so the record
  stays honest about what changed.
