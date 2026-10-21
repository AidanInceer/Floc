# Report page

One static page in the local docs: `docs/private/architecture-review-YYYY-MM-DD.html`.
`private/` is gitignored and outside the sidebar index, so the page never
enters a commit and `docs:check` does not index it. It reads from disk, with no
server and no fetch.

## Rules

- **Docs look, not a new one.** Link `../assets/docs.css`, `theme.js`,
  `nav.js`, the vendored Mermaid and `diagrams.js`. No CDN, no Tailwind.
- **Colours from docs tokens only:** `var(--ink)`, `--ink-2`, `--ink-3`,
  `--pen`, `--pen-2`, `--pen-deep`, `--red`, `--rule`, `--sheet`,
  `--sheet-2`, `--paper`. No hex. Light and dark then work by themselves.
- **Status has a word.** A rating is a word in a pill, never a colour alone.
- **No emoji.** Icons, if any, are line art (14×14 `viewBox`, stroke only).
- **Plain words.** The words table in [SKILL.md](SKILL.md) applies to every
  label in a picture too.
- **Do not reuse docs class names.** `docs.css` owns `.card` and `.cards`
  (hover lift, block spans); a finding is `.finding`.
- **Reads at 1280 and 375.** Before and after sit side by side when wide and
  stack when narrow.

## Scaffold

```html
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Architecture review, 21 Oct 2026 — Floc docs (private)</title>
<link rel="stylesheet" href="../assets/docs.css">
<script src="../assets/theme.js"></script>
<style>
  .finding { border: 1px solid var(--rule); border-radius: var(--radius-md); background: var(--sheet); padding: 20px 24px; margin: 32px 0; }
  .rating { display: inline-block; border-radius: var(--radius-pill); padding: 2px 10px; font-size: 12px; border: 1px solid var(--rule); color: var(--ink-2); }
  .rating.do { border-color: var(--pen); color: var(--pen-deep); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .pair > * { min-width: 0; overflow-x: auto; }
  @media (max-width: 760px) { .pair { grid-template-columns: 1fr; } }
  .box { border: 1px solid var(--rule); border-radius: var(--radius-sm); padding: 12px; background: var(--paper); }
  .one { background: var(--ink); color: var(--paper); border-radius: var(--radius-sm); padding: 12px; }
  .copy { color: var(--red); }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-3); }
</style>
<body data-root=".." data-page="architecture-review">
<nav id="sidebar" aria-label="Documentation"></nav>
<main>
<p class="crumb">Docs › Private</p>
<h1>Architecture review</h1>
<p>develop @ <code>5d4d430</code> · 21 Oct 2026 · Looked at: <i>the areas</i>.</p>
<p>Each card is one place where the code is harder to change than it needs to
be. Red in a picture = a copy. Dark box = the one place after the change.</p>

<!-- cards -->

<h2>Already good — leave alone</h2>
<p>…</p>

<h2>Start here</h2>
<p><a href="#c1">1 · …</a> — one sentence on why.</p>
</main>
<script src="../assets/nav.js"></script>
<script src="../assets/vendor/mermaid.min.js"></script>
<script src="../assets/diagrams.js"></script>
<script src="../assets/editor.js"></script>
</body>
```

`editor.js` lets Aidan mark the page up; `/floc:review-docs` can act on the
marks.

## Card

```html
<section class="finding" id="c1">
  <h2>1 · Turn an Explore trip's legs into stops in one place</h2>
  <p><span class="rating do">Do this</span></p>

  <h3>What happens now</h3>
  <p>An Explore trip is stored as a list of legs: travel hops and places you
  stay. Many screens show it as stops: "3 nights in Kyoto, arrive by train,
  day trip to Nara".</p>

  <h3>The problem</h3>
  <p>The rule that turns legs into stops is written 10 times: 6 on the web and
  in core, 4 on the phone. They do not agree on how to count a hop.</p>

  <div class="pair">
    <div class="box"><p class="label">Now</p> … </div>
    <div class="box"><p class="label">After</p> … </div>
  </div>

  <h3>The change</h3>
  <p>One function in <code>@floc/core</code> turns legs into stops. Every screen
  uses its result.</p>

  <h3>The benefit</h3>
  <ul><li>Change the rule once; web and phone both follow.</li></ul>

  <h3>Pros and cons</h3>
  <table>
    <tr><th>For</th><th>Against</th></tr>
    <tr><td>One set of tests, not six</td><td>Touches 10 files in one slice</td></tr>
  </table>

  <details><summary>Files</summary>
  <pre><code>core/trip/explore/detail/preset-plan.ts
web/lib/explore/route/trip-route.ts</code></pre>
  </details>
</section>
```

## Pictures

Pick the shape that fits. Do not use the same one on every card.

- **Mermaid flowchart** — who calls what. Before: many arrows into copies;
  after: one node. `diagrams.js` sets Mermaid's colours from the docs tokens
  and wraps each diagram with pan and zoom. Add no `classDef` (it needs hex).
  Mark a copy with "(copy)" in its label; draw the one place as a `[[…]]`
  node.
- **Side-by-side table** — copied constants, with the values that differ in
  `class="copy"`. Strong when two copies already disagree.
- **Boxes** — a row of `.box` per screen listing what each one sets up for
  itself (before), then one `.one` box holding it all (after).
- **Small example** — real data that shows the problem: three days
  "Rome · — · Florence" and what each copy makes of them.

Keep each picture under ~320px tall. Labels name screens and files, never
architecture words.
