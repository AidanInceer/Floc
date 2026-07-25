# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — points at one `CONTEXT.md` per venture/context. Read each one relevant to the topic.
- **`docs/adr/`** — hub-level ADRs (cross-cutting decisions affecting `shared/`, `infra/`, or multiple ventures).
- **`ventures/<name>/docs/adr/`** — venture-scoped decisions for the venture you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure (multi-context: this hub)

```
/
├── CONTEXT-MAP.md
├── docs/adr/                              ← hub-wide decisions
└── ventures/
    ├── finance-planner/
    │   ├── CONTEXT.md
    │   └── docs/adr/                      ← venture-specific decisions
    └── waypoint/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant venture's `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
