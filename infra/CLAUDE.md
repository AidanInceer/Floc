# CLAUDE.md — infra/

The hub's running infrastructure. High blast radius: changes here can affect
every venture and environment. Applies on top of the hub [`../CLAUDE.md`](../CLAUDE.md).

## Scope

- `terraform/` — cloud resources (state, envs, network, DB, secrets/KMS).
- `kubernetes/` — cluster manifests / Helm.
- `observability/` — metrics, logs, traces, dashboards, alerts.
- `ci-cd/` — pipeline definitions and reusable workflows.

## Rules

1. **Everything as code, reviewed.** No manual console changes.
2. **Never commit secrets** — no keys, tokens, kubeconfigs, or `.tfstate` with
   secrets. Use a secrets manager / KMS and remote state.
3. **Compose `shared/infra-modules`** instead of hand-writing raw resources.
4. **Environments are parameters.** Don't fork prod by copy-paste.
5. **Plan before apply.** Treat destructive changes (DB, state, networking) as
   requiring explicit human confirmation — surface the plan, don't auto-apply.
6. **GitHub Actions caveat.** Workflow files must live in `/.github/workflows/`;
   keep shared/reusable pieces here and reference them.

## Escalate

Anything that could cause downtime, data loss, or cross-environment/-venture
impact — surface it and get confirmation rather than proceeding.
