---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user says /floc:prototype, wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like — often on a ticket labelled `wayfinder:prototype`, or when /floc:grill turns up a question only a prototype can answer.
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on one page, switchable via a URL search param and a floating bottom bar. In Floc that page is a static wireframe, not an app route.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Capture it when done.** Fold any validated decision into the real code. Capture the answer — the verdict and the question it settled — on the issue. The prototype itself stays out of git (see In Floc).

## In Floc

These override the generic rules above where they differ. The biggest one: **a prototype never touches the app, never gets a branch, never gets committed.** Work goes local → `develop` → `main`, nothing else.

- **It lives in `floc/wireframe/`, which is gitignored.** One folder per prototype: `floc/wireframe/<issue>-<slug>/index.html` plus its own `.js` and `.css`. Nothing under `floc/apps/` or `floc/packages/` changes, so `verify`, lint, coverage and `fitness` never see it. No `prototype/*` branch, no `/floc:push`, no commit.
- **It runs on the wireframe port.** `pnpm wireframe` (or `preview_start` with `wireframes`) serves `floc/wireframe/` on http://localhost:4100. The root lists every prototype, grouped by the app page it is for. The server is `scripts/wireframe-server.mjs`.
- **Label it in `<head>`, under `<title>`.** The root reads these; without them the prototype lands in "Not labelled".

  ```html
  <meta name="wf-page" content="Packing">                 <!-- the app page, as the user names it -->
  <meta name="wf-route" content="/trip/[id]/packing">
  <meta name="wf-status" content="Chosen: C">            <!-- Exploring · Chosen: X · Shipped 0.149.0 -->
  <meta name="description" content="One line: what question this answers.">
  ```

  Update `wf-status` when the user picks a direction or it ships.
- **Plain HTML, CSS and JS.** No build, no framework, no packages from a CDN. Every page links the house base:

  ```html
  <link rel="stylesheet" href="/_house/house.css">
  <script src="/_house/house.js" defer></script>
  ```

  `house.css` loads the real token values from `@floc/core/design/tokens` (light and dark), the three faces, `.typed`, `.nums`, `.who-1`…`.who-8`, `.avatar`, `.btn`. `house.js` adds the light/dark switch; the page opens in light.
- **House look, still.** Colours only through `var(--token)`, never hex. Line icons (14×14 `viewBox`, stroke only), no emoji. Copy the shapes from `components/system/` by eye; do not import them. Otherwise the verdict judges the wrong thing.
- **Realistic data, in the file.** A static page cannot reach the database. Write believable trips, people and plans in the prototype's own JS, shaped like scenario A (`/floc:seed-dev-db` shows what that holds). Real words, never lorem ipsum.
- **Interactive beats pretty.** The user clicks and types in it to learn how it feels. State lives in memory; a reload starts over.
- **Variants.** Several answers to one question → `?variant=` on the same page, cycled by a small bar at the bottom centre. One agreed direction that the grill keeps changing → one page, edited round by round.
- **UI, phone.** Draw the phone as a 390×844 frame on the same page, when the question is phone-specific. Otherwise the web answer carries over through the [visual language](../../../../docs/design/visual-language.html).
- **Logic.** A TUI in `floc/wireframe/<issue>-<slug>/tui.ts`, run with `node <file>.ts`. It may import pure modules from `@floc/core` by relative path; it never writes them.
- **Hand it over with proof.** Open it with `preview_start` (`wireframes`) and send light and dark screenshots with `SendUserFile`. Give the user the URL.
- **Capture the verdict on the ticket.** Add `## Prototype verdict` to the issue body: the question, the answer, why, and the folder name. Remove the `wayfinder:prototype` label. The folder stays on the user's disk as the source; `/floc:implement-feature` rebuilds the answer properly, test-first. Open decisions left → `/floc:grill`.
