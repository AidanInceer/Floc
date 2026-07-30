# CLAUDE.md — Waypoint

Repo-level instructions for Claude Code. This repo hosts **Waypoint**, a
group-travel planner. The venture's own
[`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md) holds the product
rules and takes precedence inside that folder — read it before touching app
code. This file covers the repo plumbing around it.

## What this repo is

A pnpm + Turborepo monorepo for one venture. The real code is the Next.js app at
[`ventures/waypoint/apps/web`](ventures/waypoint/apps/web/README.md) — App
Router + Turso (libSQL) + Drizzle + Better Auth. Everything else in
`ventures/waypoint/` is docs, wireframes, and the superseded Vite prototype.

The folder layout (`ventures/waypoint/…`) is a holdover from when this was a
multi-venture hub. Waypoint is the only venture now; don't add others without
being asked.

## Current phase

**Pre-MVP.** Building a thin vertical slice, one ticket at a time. Prefer a
narrow end-to-end change over broad stubs. Confirm scope before large builds.

## Commands

```bash
pnpm install              # root; installs the workspace
pnpm dev                  # turbo run dev
pnpm build                # turbo run build
pnpm typecheck            # turbo run typecheck
pnpm lint                 # turbo run lint
pnpm test                 # turbo run test
```

Per-app work is faster scoped: `pnpm --filter waypoint-web dev` (or `test`,
`typecheck`, `lint`). Turbo tasks are declared in [`turbo.json`](turbo.json).

## Golden rules

1. **Read the venture rules first.** [`ventures/waypoint/CLAUDE.md`](ventures/waypoint/CLAUDE.md)
   carries the non-negotiables (money is never a float, day-first itinerary,
   enumeration-proof trip access, light-only, …). They win inside the venture.
2. **Read the ticket before changing behaviour.** Decisions live in
   `ventures/waypoint/.scratch/waypoint-v1/` — `map.md` is the index, one file
   per decision. The old ADRs were retired; don't treat them as current.
3. **Security first.** No secrets, keys, or tokens in the repo. No logging of
   PII/tokens. Degrade without credentials, never crash.
4. **Docs stay in sync.** A structural change updates the relevant README /
   `docs/` page. The ERD and `apps/web/src/db/schema.ts` change together.

## Conventions

- Package manager: **pnpm** (v9). Node >= 20. Build orchestration: **Turborepo**.
- Default branch: **`main`**. Feature branches → PR; CI must pass before merge.
- Commits: Conventional Commits, scoped where useful (`feat(waypoint): …`,
  `fix(ci): …`). A commit that resolves a tracked issue ends with
  `Closes <owner>/<repo>#<n>` — **fully qualified**, because issues are tracked
  in the venture's own GitHub repo (`AidanInceer/Waypoint`), so a bare `#12`
  points at the wrong tracker.
- **Commit at the end of a session, not during it.** Once the work has been
  reviewed and the go-ahead given — or the next session starts, which is the
  same signal — commit the changes: one commit per ticket, never a single
  catch-all. **Commit only; never push.** Pushing stays a separate, explicit
  ask.
- Workspaces are defined in **`pnpm-workspace.yaml` only** — new packages/apps
  must live under a globbed path to be picked up. Do not add an npm-style
  `"workspaces"` array to `package.json`; pnpm ignores it and the two silently
  drift apart.

## Gotchas

- **`ventures/waypoint/apps/prototype` is superseded** — the retired Vite /
  localStorage cut. Prior art only; don't extend it.
- **`wireframe/` directories are not packages.** Plain HTML, no install, no
  build — inline all CSS/JS, no `package.json`.
- **Deployment is per-app.** Each deployable app gets its own workflow + Vercel
  project; CI must never deploy the whole monorepo at once.

## Guardrails

- Don't wire real credentials or live keys anywhere in the repo.
- Flag anything touching auth, encryption, PII, or compliance rather than
  glossing over it.

## Agent skills

### Issue tracker

Issues/PRDs live as GitHub issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Domain docs

Multi-context: root `CONTEXT-MAP.md` points to per-venture `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
