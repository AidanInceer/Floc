# @shared/api-client

Typed **client for internal APIs** — a consistent, generated-or-hand-written way
for frontends to call venture/services backends without re-deriving request and
response shapes. **Placeholder.**

Ideally generated from API schemas (OpenAPI/typed contracts) and sharing types
with `@shared/shared-types`. Consumed by `apps/*`. Keep transport concerns
(auth headers, retries) here so apps don't reimplement them.
