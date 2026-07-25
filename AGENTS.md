# AGENTS.md — Venture Hub

Working agreements for the hub. Complements [`CLAUDE.md`](CLAUDE.md) (hard rules).
Tool-agnostic — applies to any agent or human contributor. Venture-specific
agent notes live in each venture (e.g. `ventures/nexus/`).

## Mental model

Two kinds of work:

- **Venture work** — building a specific product under `ventures/<name>/`.
  Owned by that venture's team. Free to move fast within its folder.
- **Foundation work** — `shared/`, `infra/`, `security-compliance/`,
  `internal-tools/`, `enablement/`. Changes here affect *every* venture, so
  they demand more care, review, and versioning.

## How we work

- **Thin vertical slices** within a venture beat broad horizontal stubs.
- **Reuse before rebuild.** Search `shared/` and `enablement/templates/` first.
- **Foundation changes are contracts.** Treat `shared/*` and `infra/*` as public
  APIs other ventures depend on — version and document breaking changes.
- **Docs are part of "done."** Update the README/doc next to what you changed.
- **Ask on placement.** Venture-specific vs shared is the highest-leverage
  decision — get it right up front.

## Ownership map (functions → areas)

Rough guide for who owns what as the org grows (see
[`docs/areas-and-teams.md`](docs/areas-and-teams.md) for detail):

| Area | Primary owner |
|---|---|
| `ventures/*/apps` | Product + Frontend |
| `ventures/*/services` | Backend / Domain |
| `ventures/*/data-platform` | Data Engineering / Analytics |
| `shared/packages/design-system`, `ui-kit` | Design + Design Systems |
| `shared/packages/shared-*`, `api-client` | Platform / DevEx |
| `shared/infra-modules`, `infra/` | Platform / SRE / DevOps |
| `shared/data-modules` | Data Platform |
| `security-compliance/` | Security + Compliance |
| `internal-tools/` | Internal Tools / IT |
| `enablement/` | Platform / DevEx (developer experience) |

## Definition of done

- [ ] Code is in the right place (venture vs shared) and picked up by a workspace glob.
- [ ] No secrets/PII/tokens in code or logs.
- [ ] Reused existing shared code where it existed (didn't duplicate).
- [ ] Matching README/doc updated; cross-cutting decisions recorded as an ADR.
- [ ] Foundation changes note their blast radius on dependent ventures.

## Escalate (don't silently proceed) when

- A change to `shared/*` or `infra/*` would break a dependent venture.
- Something touches auth, encryption, consent/token storage, or compliance evidence.
- You're unsure whether new code is venture-specific or a shared foundation.
