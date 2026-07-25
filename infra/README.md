# infra/

The hub's own **running infrastructure** — the cloud, clusters, monitoring, and
pipelines that everything else runs on. (Reusable, parameterised modules live in
[`../shared/infra-modules/`](../shared/infra-modules/); this folder is the
*actual* infrastructure that consumes them.) **Placeholders — nothing
provisioned yet.**

## Subfolders

- **[`terraform/`](terraform/)** — cloud resources as code: state backend,
  environments (dev/staging/prod), networking, databases, secrets/KMS.
- **[`kubernetes/`](kubernetes/)** — cluster manifests / Helm charts for
  deploying services.
- **[`observability/`](observability/)** — metrics, logs, traces, dashboards,
  and alerting (e.g. Prometheus/Grafana/OpenTelemetry). Where SRE/monitoring lives.
- **[`ci-cd/`](ci-cd/)** — pipeline definitions and reusable CI workflows.
  (GitHub Actions must physically live in `/.github/workflows/`; keep shared
  workflow logic and templates referenced from here.)

## Principles

- **Everything as code**, reviewed and versioned. No click-ops.
- **Compose `shared/infra-modules`** rather than hand-writing raw resources.
- **Secrets never in the repo** — reference a secrets manager / KMS.
- **Environments are parameters**, not copy-pasted trees.
