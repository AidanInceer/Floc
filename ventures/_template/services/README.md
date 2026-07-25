# services/

Backend for this venture — APIs, workers, and pure domain logic. Each service
is its own workspace package (picked up by `ventures/*/services/*`).

Convention: keep framework-free, deterministic, unit-tested business rules in a
`domain` library (e.g. `services/domain`); let APIs and workers orchestrate
around it. Replace this file with real services.
