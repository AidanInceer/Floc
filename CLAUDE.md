# CLAUDE.md — Waypoint

Repo plumbing for **Waypoint**, a group-travel planner. A pnpm + Turborepo
monorepo with one venture. The real code is the Next.js app at
[`ventures/waypoint/apps/web`](ventures/waypoint/apps/web/README.md) — App
Router + Turso (libSQL) + Drizzle + Better Auth.

The venture's own [`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md)
holds the product rules and **wins inside that folder — read it before touching
app code.** Waypoint is the only venture; don't add others without being asked.

**Phase: pre-MVP.** Thin vertical slice, one ticket at a time. Prefer a narrow
end-to-end change over broad stubs. Confirm scope before large builds.

## Key docs

`docs/` is a tiny local-only HTML site — open
[`docs/index.html`](docs/index.html) off disk (no server, no build). Start
there. The four you'll reach for most:

- **Design direction** — [`docs/design/approach.html`](docs/design/approach.html)
- **Visual language** — [`docs/design/visual-language.html`](docs/design/visual-language.html)
- **Architecture** — [`docs/architecture/architecture.html`](docs/architecture/architecture.html)
- **Data model (ERD)** — [`docs/data-model/erd.html`](docs/data-model/erd.html)

## Commands

```bash
pnpm install      # installs the workspace (root)
pnpm dev          # turbo run dev   (build | typecheck | lint | test likewise)
```

Scope for speed: `pnpm --filter waypoint-web <task>`. Tasks live in
[`turbo.json`](turbo.json).

## Golden rules

1. **Read the venture rules first.** [`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md)
   carries the non-negotiables (money is never a float, day-first itinerary,
   enumeration-proof trip access, light-only, …).
2. **Read the ticket before changing behaviour.** Decisions live in
   `ventures/waypoint/.scratch/waypoint-v1/`; `map.md` is the index, one file
   per decision.
3. **Security first.** No secrets, keys, or tokens in the repo. No logging of
   PII/tokens. Degrade without credentials, never crash. Flag anything touching
   auth, encryption, PII, or compliance rather than glossing over it.
4. **Docs stay in sync.** A structural change updates the relevant README /
   `docs/` page. The ERD and `apps/web/src/db/schema.ts` change together.

## The docs are HTML

HTML is the source of truth — no `.md` originals, edit the page itself. Every
page is a flat shell: `<link>` to `assets/docs.css`, `<nav id="sidebar">`,
`<main>`, `<script src>` to `assets/nav.js`. Two `<body>` attributes wire it up:
`data-root` (path back up to `docs/` — `.` at top, `..` one level down) and
`data-page` (the page id).

- **Every page except `index.html` lives in a topic folder** (`design/`,
  `architecture/`, `data-model/`, …). Only `index.html` sits at the root.
- **Adding a page = adding a line to the `TREE` array in
  [`docs/assets/nav.js`](docs/assets/nav.js).** That array is the whole sidebar;
  a page not listed there is unreachable.
- Diagrams are `<pre class="mermaid">`; such a page loads, in order, the vendored
  `assets/vendor/mermaid.min.js` then [`assets/diagrams.js`](docs/assets/diagrams.js).
  Load everything via plain `<script src>` — `fetch`/ES modules are blocked on
  the `file://` origin, and the site must work offline.
- `docs/mockups/` is **not** part of the site — standalone wireframes opened in
  their own tab. Leave them as they are.

## Conventions

- **pnpm** (v9), Node >= 20, **Turborepo**. Workspaces are defined in
  **`pnpm-workspace.yaml` only** — never add an npm-style `"workspaces"` array.
- **Work lands on `main` directly.** No feature branches, no PRs. Commit at the
  end of a session (or when the next one starts): one commit per ticket, never a
  catch-all.
- **Commit subject: `<version> #<issue>: <type>: <description>`** — e.g.
  `0.4.0 #93: feat: split the profile into two faces`. Nothing precedes the
  version digit.
  - **version** — next app version; bump
    `ventures/waypoint/apps/web/package.json` to match in the same commit. Minor
    for a feature, patch for a fix; major only when the maintainer says so.
  - **issue** — bare `#n` in the subject; the body ends with a fully-qualified
    `Closes AidanInceer/Waypoint#<n>` (issues live in the venture's own repo).
  - **type** — `feat` | `fix` | `docs` | `refactor` | `chore` | `test`.
  - **description** — sentence case, no full stop.
- **Windows commit gotcha:** with a PowerShell here-string, `@'` must be last on
  its line and `'@` alone at column 0 — otherwise the `@` leaks into the message.
  Verify with `git log -1 --format=%s`; the subject must start with a digit, not `@`.

## Gotchas

- **`wireframe/` directories are not packages** — plain HTML, no install, no
  build, no `package.json`; inline all CSS/JS.
- **Deployment is per-app.** Each deployable app gets its own workflow + Vercel
  project; CI must never deploy the whole monorepo at once.

## Agent skills

Issues/PRDs live as GitHub issues (`gh` CLI). See
[`docs/agents/issue-tracker.html`](docs/agents/issue-tracker.html) and
[`docs/agents/domain.html`](docs/agents/domain.html).
