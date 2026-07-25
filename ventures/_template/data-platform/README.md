# data-platform/

Data engineering for this venture — ingestion pipelines, warehouse models, and
analytics. Each pipeline/model set is its own workspace package (picked up by
`ventures/*/data-platform/*`).

Build on `shared/data-modules` (reusable pipeline/warehouse templates) rather
than bespoke pipelines. Keep deterministic business math in `services/domain`,
not here. Replace this file with real pipelines.
