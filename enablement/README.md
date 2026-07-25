# enablement/

**Developer experience** — the leverage that keeps many teams fast and
consistent. If `shared/` is reusable *product* code, `enablement/` is how teams
*build*. **Placeholders.**

## Subfolders

- **[`templates/`](templates/)** — starter templates for new services, apps, and
  pipelines (beyond `ventures/_template` — e.g. "new NestJS service", "new dbt
  model", "new React app").
- **[`cli/`](cli/)** — an internal CLI to scaffold from templates, run codegen,
  and automate common tasks (`nexus new venture <name>`, `nexus new service …`).
  This is the one enablement package that's a real workspace member.
- **[`standards/`](standards/)** — shared config and conventions: base
  `tsconfig`, ESLint, Prettier, commit conventions, code-owners patterns.
- **[`onboarding/`](onboarding/)** — getting-started guides so a new engineer is
  productive fast (environment setup, first-PR walkthrough, glossary).

## Principles

- **Golden paths, not cages.** Make the right way the easy way; allow escape
  hatches.
- **Automate the boilerplate** so teams spend time on product, not plumbing.
- **One source of standards** — ventures extend `standards/`, they don't fork it.
