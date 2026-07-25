# shared/infra-modules

Reusable **Terraform / Kubernetes modules** that ventures and the hub's
[`infra/`](../../infra/) compose — e.g. a VPC/network module, a managed-Postgres
module, a standard service deployment, an S3/bucket module. **Placeholder.**

Parameterised and versioned so each venture stamps out consistent, reviewed
infrastructure instead of writing raw resources. Distinct from `infra/`, which
holds the hub's *actual running* infrastructure that consumes these modules.
