# security-compliance/

Security and **software** compliance across the whole hub. (This is distinct
from *legal* compliance — GDPR/contracts/regulatory — which is a business
function, not this repo.) **Placeholders — nothing enforced yet.**

## Subfolders

- **[`policies-as-code/`](policies-as-code/)** — guardrails enforced
  automatically: IaC policy (OPA/Sentinel/Conftest), admission controls, allowed
  regions/instance types, required tags, branch-protection-as-code.
- **[`vulnerability-tooling/`](vulnerability-tooling/)** — scanning config:
  SAST/DAST, dependency (SCA), container image, and secret scanning, wired into
  CI so findings block or flag.
- **[`compliance-evidence-automation/`](compliance-evidence-automation/)** —
  automated collection of audit evidence for frameworks like SOC 2 / ISO 27001
  (control mappings, access reviews, log retention proofs).

## Principles

- **Shift left.** Catch issues in CI, not in production.
- **Guardrails over gates.** Prefer automated policy to manual sign-off.
- **Evidence is a by-product, not a project.** Automate collection continuously.
- Applies to *all* ventures — teams inherit these controls rather than each
  inventing their own.
