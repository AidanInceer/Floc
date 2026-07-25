# Data flow

Described the way it was framed: left → right, from raw bank data to advice.

```
┌──────────────┐   ┌───────────────┐   ┌────────────────┐   ┌───────────────┐   ┌──────────────┐
│  SOURCES     │   │  INGEST &     │   │  MODEL &       │   │  REASON &      │   │  PRESENT     │
│              │   │  NORMALISE    │   │  FORECAST      │   │  ADVISE        │   │              │
│ • Banks      │──▶│ • Open-bank   │──▶│ • Categorise   │──▶│ • Rubrics      │──▶│ • Dashboard  │
│   (open      │   │   connectors  │   │ • Recurring    │   │ • Knowledge    │   │ • Cashflow   │
│   banking)   │   │ • Normalise   │   │   detection    │   │   base (UK gov)│   │   chart      │
│ • Manual     │   │   to canonical│   │ • Cashflow     │   │ • Risk profile │   │ • Advice     │
│   entries    │   │   Transaction │   │   projection   │   │ • Claude       │   │   feed       │
│ • Knowledge  │   │ • Dedupe      │   │ • Scenarios    │   │   narrative    │   │ • Scenarios  │
│   feeds      │   │               │   │                │   │                │   │              │
└──────────────┘   └───────────────┘   └────────────────┘   └───────────────┘   └──────────────┘
      raw            canonical data        projections         recommendations       UI
```

## Stage 1 — Sources

- **Banks** via open banking: transaction logs + current balances (the primary
  feed). UK first — Barclays, Monzo, Revolut, Zopa, etc.
- **Manual entries**: things banks can't know — a known future one-off (furniture
  budget), a planned income change, ring-fenced pots, assets held elsewhere
  (crypto, ISAs).
- **Knowledge feeds**: UK gov reference data (tax bands, NI, allowances, IHT),
  refreshed on a schedule. See [`modules/knowledge-base.md`](modules/knowledge-base.md).

## Stage 2 — Ingest & normalise

- Provider-specific connectors pull data and map it to a **canonical
  `Transaction` / `Account` / `Balance`** shape (see [`domain-model.md`](domain-model.md)).
- Dedupe, currency-tag, and store. Tokens encrypted at rest.
- Output: a clean, provider-agnostic ledger the rest of the system trusts.

## Stage 3 — Model & forecast

- **Categorise** transactions (rules + AI). Essentials vs discretionary,
  recurring vs one-off.
- **Detect recurring** items (salary, rent/mortgage, subscriptions) → the
  backbone of the forecast.
- **Project cash flow** forward month by month: opening balance + income −
  outgoings ± known one-offs, tracking a running "spending cash" balance and
  flagging the **lowest point** and runway. This is the generalised version of
  the Excel `Cashflow` tab.
- **Scenarios**: "what if I move in month 5?", "what if I sweep excess above £X
  into savings?" — parameterised, like the Excel inputs.

## Stage 4 — Reason & advise

- Apply **rubrics**: emergency-fund target (n months of essentials), order of
  saving/paying-down, buffer thresholds — tuned by the user's **risk appetite**.
- Ground guidance in the **knowledge base** (correct current UK figures).
- Use **Claude** to turn the numbers + rubric results + knowledge into clear,
  sourced narrative guidance. Always informational, never regulated advice.

## Stage 5 — Present

- Dashboard (net position, "spending cash today", lowest point ahead).
- Cash-flow chart with the runway and trough highlighted.
- Advice feed (prioritised, actionable, sourced).
- Scenario controls.

See [`mockups/`](mockups/) for how these surfaces might look.
