# Module: Open Banking

**Goal:** turn "plug in your banks" into a clean, provider-agnostic ledger the
rest of Finance Planner can trust.

## Responsibilities

- Connect a user's bank via an authorised open-banking provider (AISP).
- Manage the **consent lifecycle** (grant, expiry, re-consent, disconnect).
- Sync **transactions** and **balances** on a schedule and on demand.
- **Normalise** provider-specific payloads into the canonical `Account` /
  `Transaction` / `Balance` shapes (see [`../domain-model.md`](../domain-model.md)).
- Dedupe and persist. Encrypt tokens at rest.

## Provider abstraction (the extensibility seam)

One interface, many adapters. New provider = new adapter, no changes elsewhere.

```ts
interface BankDataProvider {
  createConsentLink(userId: string): Promise<{ url: string; reference: string }>;
  completeConsent(reference: string, callbackParams: unknown): Promise<Connection>;
  listAccounts(connectionId: string): Promise<ProviderAccount[]>;
  fetchTransactions(accountId: string, since?: string): Promise<ProviderTransaction[]>;
  fetchBalances(accountId: string): Promise<ProviderBalance[]>;
  disconnect(connectionId: string): Promise<void>;
}
```

- **UK candidates:** GoCardless Bank Account Data (formerly Nordigen) — broad free
  UK coverage; TrueLayer — rich UK coverage. Chosen provider set via
  `OPEN_BANKING_PROVIDER`.
- Coverage note: covers the accounts in the source model (Barclays, Monzo,
  Revolut, Zopa). Crypto (Coinbase) and some ISAs may need **manual** accounts.

## Sync model

- **Initial sync:** pull historical window (e.g. 12–24 months) on connect.
- **Incremental:** scheduled pulls (respecting provider rate/consent limits) +
  a manual "refresh now".
- **Dedupe:** stable key from (accountId, provider txn id) with a fallback
  heuristic (date+amount+description) where ids are unstable.
- **Normalisation:** map to canonical shape; tag currency; sign amounts
  (negative = out); attach raw payload id for traceability.

## Consent & security

- Tokens (access/refresh) **encrypted at rest** (`TOKEN_ENCRYPTION_KEY`).
- Track consent expiry; prompt re-consent before lapse.
- **Disconnect** revokes with the provider and purges tokens + optionally data.
- Never log tokens or full account numbers. See [`../security-and-compliance.md`](../security-and-compliance.md).

## Failure handling

- Providers are flaky: retries with backoff, partial-sync tolerance, surfaced
  "last synced" state per account.
- Never block the UI on a live sync — read from the stored ledger.

## Out of scope (MVP)

- Payment initiation (PISP). Read-only (AISP) data only.
- Non-UK institutions.

## Open questions

- Provider selection final call (coverage vs cost vs consent UX).
- Retention window for raw provider payloads.
