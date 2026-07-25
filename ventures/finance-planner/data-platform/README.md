# finance-planner / data-platform

The venture's **data engineering** area: pipelines, warehouse models, and
analytics. **Placeholder — nothing built yet.**

## Likely contents

- **Ingestion** — normalise open-banking transaction/balance feeds into the
  canonical ledger (see [`../docs/modules/open-banking.md`](../docs/modules/open-banking.md)).
- **Warehouse models** — categorised spend, recurring-item detection features,
  forecast inputs (dbt-style models are a candidate).
- **Analytics** — spend categorisation quality, forecast-vs-actual accuracy —
  the core things this venture exists to validate.

## Reuse

Build on the hub's [`shared/data-modules`](../../../shared/data-modules/)
(reusable pipeline/warehouse templates) rather than bespoke pipelines.

## Note

Pure forecast **calculation** is not here — that's in
[`../services/domain`](../services/domain/). This area is about moving,
modelling, and analysing data, not the deterministic finance math.
