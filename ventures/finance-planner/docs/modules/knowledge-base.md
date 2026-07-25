# Module: Knowledge Base

**Goal:** give the advice engine **correct, current, sourced** reference data —
starting with UK tax/benefit figures — without hallucinating.

## What it holds (UK first)

- Income tax bands & rates, personal allowance.
- National Insurance thresholds & rates.
- ISA allowance (£20,000/yr across types) and other allowances.
- Inheritance tax nil-rate bands.
- Capital gains / dividend allowances (as needed).
- "Steps to financial freedom" heuristics (emergency-fund norms, order of
  saving) — guidance conventions, versioned separately from statutory figures.

## Design

- **Jurisdiction-keyed** (`UK` first). New market = new jurisdiction entry; the
  advice engine reads by jurisdiction. This is how "expandable to other markets"
  stays additive.
- **Tax-year aware.** Figures are versioned by tax year (e.g. UK `2026/27`), with
  effective-from/to dates. The engine always resolves the correct year.
- **Sourced.** Every figure carries a `source` (gov.uk URL) and `retrievedAt`.
  Advice cites these.
- **Structured first, RAG later.** Start with a small, hand-curated, typed
  dataset (bands/rates as data, not prose). Add retrieval/embeddings over gov.uk
  guidance only if free-text Q&A demands it.

## Shape (illustrative)

```ts
interface TaxYearData {
  jurisdiction: "UK";
  taxYear: "2026/27";
  effectiveFrom: string; effectiveTo: string;
  incomeTax: { bands: { name: string; from: number; to: number | null; rate: number }[]; personalAllowance: number };
  nationalInsurance: { /* thresholds & rates */ };
  isaAllowance: number;
  inheritanceTax: { nilRateBand: number; /* … */ };
  source: string; retrievedAt: string;
}
```

## Refresh

- Scheduled refresh (`KNOWLEDGE_BASE_REFRESH_CRON`) to check for updated figures;
  changes reviewed before they go live (statutory figures shouldn't silently
  change mid-tax-year without notice).
- Manual override/pin for a known year while sources lag.

## Guardrails

- The advice engine may **only** use figures from here (or the computed forecast)
  — never model-invented numbers.
- Stale data is flagged; if the current tax year isn't loaded, advice that needs
  it degrades gracefully ("figure unavailable") rather than guessing.

## Out of scope (MVP)

- Full tax computation/filing.
- Non-UK jurisdictions (structure supports them; data comes later).

## Open questions

- Best canonical source format for gov.uk figures (some are prose, not tables).
- Review workflow for statutory changes.
