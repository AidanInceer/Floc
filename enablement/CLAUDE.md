# CLAUDE.md — enablement/

Developer experience: templates, internal CLI, standards, onboarding. Applies on
top of the hub [`../CLAUDE.md`](../CLAUDE.md).

## Scope

- `templates/` — starter templates for services/apps/pipelines.
- `cli/` — internal CLI (scaffold, codegen, tasks); a real workspace package.
- `standards/` — shared tsconfig/eslint/prettier + conventions.
- `onboarding/` — new-engineer ramp guides.

## Rules

1. **Standards are the single source.** Ventures extend `standards/` configs;
   they don't copy or fork them. Change here → it propagates everywhere.
2. **Templates encode current best practice.** Keep them working and current; a
   stale template misleads every new project made from it.
3. **CLI changes are high-leverage.** The CLI scaffolds real code — test it;
   a bug ships into every generated project.
4. **Golden paths, not cages.** Provide the easy default; allow escape hatches.
