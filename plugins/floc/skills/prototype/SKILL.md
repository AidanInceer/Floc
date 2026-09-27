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
  <meta name="wf-status" content="Exploring: A–F">       <!-- see "The tag follows the work" -->
  <meta name="description" content="One line: what question this answers.">
  ```

  `wf-page` must be a page name from `SECTIONS` in `scripts/wireframe/nav.js`, or it lands in "Other".
- **Plain HTML, CSS and JS.** No build, no framework, no packages from a CDN. Every page links the house base:

  ```html
  <link rel="stylesheet" href="/_house/house.css">
  <script src="/_house/house.js" defer></script>
  ```

  `house.css` loads the real token values from `@floc/core/design/tokens` (light and dark), the three faces, `.typed`, `.nums`, `.who-1`…`.who-8`, `.avatar`, `.btn`. `house.js` adds the light/dark switch; the page opens in light.
- **House look, still.** Colours only through `var(--token)`, never hex. Line icons (14×14 `viewBox`, stroke only), no emoji. Copy the shapes from `components/system/` by eye; do not import them. Otherwise the verdict judges the wrong thing.
- **Realistic data, in the file.** A static page cannot reach the database. Write believable trips, people and plans in the prototype's own JS, shaped like scenario A (`/floc:seed-dev-db` shows what that holds). Real words, never lorem ipsum.
- **Interactive beats pretty.** The user clicks and types in it to learn how it feels. State lives in memory; a reload starts over.
- **Variants.** Several answers to one question → `?variant=` on the same page, cycled by a small bar at the bottom centre. One agreed direction that the grill keeps changing → one page, edited round by round. How the rounds run: [Rounds](#rounds).
- **UI, phone.** Draw the phone as a 390×844 frame on the same page, when the question is phone-specific. Otherwise the web answer carries over through the [visual language](../../../../docs/design/visual-language.html).
- **Logic.** A TUI in `floc/wireframe/<issue>-<slug>/tui.ts`, run with `node <file>.ts`. It may import pure modules from `@floc/core` by relative path; it never writes them.
- **Hand it over with proof.** Screenshot with Playwright, not the browser pane (the pane is too small, and its screenshots time out). Put a short script in `floc/wireframe/<folder>/_shots/`, run it from the prototype folder, and write the images to that same `_shots/`. `_landing/shoot.mjs` is the pattern: path, out, theme, wait, width, height, and `SCROLL`/`CLICK` env vars. Collect page errors in the script and report them. Send light and dark with `SendUserFile`, plus the moment that matters (mid-animation, a narrow width). Give the user the URL with `?variant=`.
- **Capture the verdict on the ticket.** Add `## Prototype verdict` to the issue body: the question, the answer, why, and the folder name. Remove the `wayfinder:prototype` label. The folder stays on the user's disk as the source; `/floc:implement-feature` rebuilds the answer properly, test-first. Open decisions left → `/floc:grill`.

## Rounds

What has worked, round by round, on the landing wireframes:

1. **Round 1: the number asked for, else 3–6.** Keys `A`, `B`, `C`… Each is structurally different, not a recolour. Read what the user likes on neighbouring bands or pages first, and name it: a new band must sit beside them. Show the neighbours as ghost sections ("Above: … — unchanged") so it is never judged alone. For a visual brief, use the `frontend-design` skill.
2. **Real content.** Copy real data into the file: listings from `@floc/core` (preset trips, prices, stops), tokens through `house.css`. Invent only what the product does not hold yet.
3. **Feedback round.** The user ranks the options ("A for simple, D I really like, F no"). Keep every variant; add the new ones after them (`G`, `H`, `I`), including any merge asked for ("D with B's bar"). Update `description` to the new count.
4. **Refine the pick in place.** A change to one variant → a suffixed variant beside it (`G2`), so the original stays to compare. Later rounds edit `G2` itself.
5. **Motion.** Asked for "some, not too much": one moment, not scattered effects. When two things must move together (a map line and a bar), drive both from one JS clock, not two CSS animations. Reduced motion → show the end state.
6. **Outside resources.** Anything fetched (map tiles, fonts) must answer without a key: check it returns 200 with the right content before you use it. Note what the real build will use and its credits. A wireframe choice is not a provider decision.
7. **Keep the history.** After each round, write the picks and the reasons to memory, so the next session does not redo them.

## The tag follows the work

`wf-status` is the one record of where a prototype stands. The sidebar reads the first word. Keep it true at every step, and never leave it for the user to fix.

| When | `wf-status` | Also |
|---|---|---|
| Built, or a new round added | `Exploring: A–I` | |
| The user picks one | `Chosen: G2` | Add `<meta name="wf-picked" content="YYYY-MM-DD">`. Set sibling folders that asked the same question to `Parked: <why>, chosen in <folder>`. |
| A direction is dropped for now | `Parked: D, <why>` | |
| `/floc:push` lands the build on `develop` | `Chosen: G2, on develop <version>` | `/floc:push` does this. |
| `/floc:release` deploys it | `Shipped <version>` (`Shipped <version> as G2` if it had variants) | `/floc:release` does this after the deploy reports `success`. |

A `Chosen` prototype built but not pushed keeps plain `Chosen: G2`. Edit the tag in the prototype's `index.html` only; `floc/wireframe/` is gitignored, so this never enters a commit.
