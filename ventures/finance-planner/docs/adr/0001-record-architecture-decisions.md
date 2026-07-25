# 1. Record architecture decisions

Date: 2026-07-24

## Status

Accepted

## Context

Finance Planner is intended to be modular and expandable over years. Decisions about
structure, stack, and boundaries need to be discoverable and revisitable, rather
than living only in someone's head or a chat log.

## Decision

We record significant architectural decisions as **Architecture Decision Records
(ADRs)** in `docs/adr/`, one file per decision, numbered sequentially. Each ADR
states context, the decision, and consequences, and carries a status
(Proposed / Accepted / Superseded).

## Consequences

- New significant decisions add a numbered ADR.
- Superseding a decision links forward to the replacement rather than editing
  history.
- Agents and contributors can trace *why* the system is the way it is.
