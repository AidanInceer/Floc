# CLAUDE.md — security-compliance/

Security and software-compliance controls that apply hub-wide. Applies on top of
the hub [`../CLAUDE.md`](../CLAUDE.md).

## Scope

- `policies-as-code/` — automated guardrails (IaC policy, admission control).
- `vulnerability-tooling/` — SAST/DAST/SCA/secret/image scanning config.
- `compliance-evidence-automation/` — SOC 2 / ISO 27001 evidence collection.

Note: **software** compliance (security frameworks), not legal/GDPR/contracts.

## Rules

1. **Never weaken a control to make something pass.** Fix the underlying issue;
   if a control is wrong, change it deliberately with justification.
2. **No secrets, no real audit data** committed here — configs and policies only.
3. **Guardrails are shared contracts.** A policy change affects every venture's
   CI — assess blast radius and communicate it.
4. **False positives get tuned, not disabled wholesale.** Prefer targeted
   suppressions with a reason over turning a scanner off.

## Escalate

Any actual vulnerability, exposed secret, or control gap you discover — surface
it explicitly; don't quietly work around it.
