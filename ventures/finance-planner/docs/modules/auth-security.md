# Module: Auth & Security

**Goal:** secure single-user (later multi-user) authentication with 2FA, and the
plumbing to keep financial data safe. Complements the posture in
[`../security-and-compliance.md`](../security-and-compliance.md).

## Authentication

- **Email + password**, password hashed with **argon2** (or bcrypt).
- **TOTP 2FA** (authenticator app) — enrolled during onboarding, required at
  login. Issuer set via `TOTP_ISSUER`. Backup codes generated at enrolment.
- **Sessions:** server-side sessions with **httpOnly, Secure, SameSite** cookies.
  Short idle timeout + rotating session ids. Signed with `AUTH_SESSION_SECRET`.
- **CSRF protection** on state-changing requests; **rate limiting** on auth
  endpoints; generic error messages (no user enumeration).

## Authorisation

- Every data access is scoped to the authenticated `userId`. A user can only ever
  read/write their own accounts, transactions, and forecasts.
- API guards enforce this centrally (NestJS guards), not per-handler ad hoc.

## Token & secret handling

- Open-banking access/refresh tokens **encrypted at rest** with
  `TOKEN_ENCRYPTION_KEY` (KMS-backed in prod). Decrypted only in memory when
  calling the provider.
- No secrets, tokens, or PII in logs. Redaction in the logger config.
- Secrets from env only; `.env` git-ignored; `.env.example` documents keys.

## Session/consent lifecycle

- Login → 2FA → session. Logout revokes the session.
- Open-banking consent tracked with expiry; re-consent prompts before lapse;
  disconnect revokes with provider and purges tokens.

## Threats addressed

| Threat | Mitigation |
|---|---|
| Credential stuffing | Rate limit, 2FA, argon2, breach-aware password rules. |
| Session hijack | httpOnly/Secure/SameSite cookies, rotation, short TTL. |
| Token theft at rest | Encryption with managed key; least-privilege access. |
| CSRF | Token/double-submit on mutations. |
| Injection | Zod validation at boundaries; parameterised queries (Prisma). |
| Data leakage | No PII/tokens in logs/URLs; per-user authZ. |

## MVP vs later

- **MVP:** single user, the above baseline, 2FA on.
- **Later:** multi-user, roles, audit log, WebAuthn/passkeys, device management.

## Open questions

- Session store (DB vs Redis) as usage grows.
- Recovery flow that stays secure without a support team (personal tool).
