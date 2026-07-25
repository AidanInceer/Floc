# Security & compliance

Finance Planner handles financial data and PII. Security is a first-class requirement, not
a later hardening pass. This doc sets the posture; [`modules/auth-security.md`](modules/auth-security.md)
covers the auth mechanics.

## Threat-model summary

- **Assets:** bank access tokens, transaction/balance data, PII, session creds.
- **Primary risks:** token theft, session hijacking, data leakage via logs,
  injection at trust boundaries, over-broad open-banking consent.

## Principles

1. **Least data.** Only pull and store what a feature needs. Prefer derivation
   over storage. No PII in URLs/query strings.
2. **Encrypt secrets at rest.** Open-banking access/refresh tokens encrypted with
   `TOKEN_ENCRYPTION_KEY` (KMS-backed in production). Never stored in plaintext.
3. **Never log secrets or PII.** Structured logging with explicit allowlists;
   redact tokens, account numbers, amounts where not needed.
4. **Validate every boundary.** Zod-validate API inputs and provider payloads.
   Treat all external/tool data as untrusted input.
5. **Strong auth.** Password hashing (argon2/bcrypt), TOTP 2FA, httpOnly +
   SameSite session cookies, CSRF protection, rate limiting on auth endpoints.
6. **Consent lifecycle.** Track open-banking consent expiry; re-consent flows;
   easy disconnect that revokes and purges tokens.
7. **Encryption in transit.** HTTPS everywhere; HSTS.

## Data handling

- Store money as integer minor units; never leak full account numbers (mask).
- Right to erasure: a user can disconnect a bank and delete their data.
- Backups encrypted; access audited.

## Regulatory posture (UK, informational)

- **Open banking** access uses an authorised provider (AISP) — Finance Planner consumes
  their API rather than becoming a regulated entity itself. Confirm the provider's
  regulatory coverage before go-live.
- **GDPR / UK GDPR:** lawful basis, data minimisation, subject rights, retention
  limits. Even as a personal tool, build these habits in.
- **Not regulated financial advice.** Outputs are informational/educational and
  sourced. Avoid personalised regulated investment recommendations. Show a clear
  disclaimer. If the product ever gives regulated advice, that requires FCA
  authorisation — out of scope.
- **Third-party PII:** the Excel model references a second occupant's share of
  costs. Storing another identifiable person's financial data raises consent
  obligations — keep such figures as un-attributed parameters, not personal records.

## Secrets management

- `.env` is git-ignored; `.env.example` documents keys only.
- No credentials, tokens, or live keys committed. Ever.
- Rotate keys on exposure; separate keys per environment.

## Checklist before any feature touching money/PII ships

- [ ] Tokens/secrets encrypted at rest, absent from logs.
- [ ] Inputs validated at the boundary.
- [ ] AuthZ enforced (user can only see their own data).
- [ ] Consent/disconnect path works and purges.
- [ ] Disclaimer present on advice surfaces.
