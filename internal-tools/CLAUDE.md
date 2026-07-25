# CLAUDE.md — internal-tools/

Internal, non-customer-facing tools. Applies on top of the hub
[`../CLAUDE.md`](../CLAUDE.md).

## Scope

- `internal-docs-site/` — self-hosted handbook / knowledge base.
- `admin-dashboards/` — internal admin/ops UIs.
- `support-tooling/` — customer-support internal tools.

## Rules

1. **Internal is not a security exception.** These touch production data — apply
   the same auth, per-user authZ, and audit logging as customer apps.
2. **Audit sensitive actions.** Impersonation, data edits, refunds — log who did
   what, when.
3. **Reuse `shared/`** (ui-kit, api-client, types) rather than bespoke stacks.
4. **One tool for all ventures** beats a copy per venture where feasible.
