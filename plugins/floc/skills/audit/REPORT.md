# Audit page scaffold

One file, `docs/process/site-audit.html`, replaced whole on every run. Do not
keep old copies; git does not track `docs/`, so the last run is the only one.

Rules for the page:

- One table per group, in the report order. A group with no findings is left out.
- Each row: number, what you saw (one sentence), where (route and `path:line`),
  the rule or ADR it breaks. No second paragraph.
- Numbers run on across groups (1, 2, 3 …) so the user can say "fix 1 and 4".
- The top line says what was audited: commit, date, who you signed in as, what
  you could not cover.
- Escape `<`, `>` and `&` in finding text. Code goes in `<code>`.

```html
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site audit — Floc docs</title>
<link rel="stylesheet" href="../assets/docs.css">
<script src="../assets/theme.js"></script>
<style>
  .audit td:first-child { width: 2.5em; color: var(--ink-3); font-variant-numeric: tabular-nums; }
  .audit td:nth-child(3) { width: 26%; }
  .audit td:nth-child(4) { width: 16%; color: var(--ink-2); }
  .audit td { vertical-align: top; }
  .counts { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 8px; }
  .counts span { border: 1px solid var(--rule); border-radius: var(--radius-pill); padding: 2px 10px; font-size: 12px; color: var(--ink-2); }
  .counts .top { border-color: var(--pen); color: var(--pen-deep); }
</style>
<body data-root=".." data-page="site-audit">
<nav id="sidebar" aria-label="Documentation"></nav>
<main>
<h1>Site audit</h1>
<p>develop @ <code>SHA</code> · D Mon YYYY · Signed in as NAME (seed X) · 1280 and 375 · Not covered: …</p>
<div class="counts"><span class="top">Untrue N</span><span>Bugs N</span><span>Rule breaks N</span><span>Fit the moment N</span><span>Streamline N</span><span>Phone N</span><span>Gaps N</span></div>
<p><strong>Fix first:</strong> <a href="#f1">1 · short title</a> — one sentence on why.</p>

<h2>Untrue</h2>
<table class="audit">
  <thead><tr><th>#</th><th>Finding</th><th>Where</th><th>Breaks</th></tr></thead>
  <tbody>
    <tr id="f1"><td>1</td><td>What you saw, in one sentence.</td><td><code>/trip/2/dates</code> · <code>path/file.ts:131</code></td><td>Rule 3</td></tr>
  </tbody>
</table>

<!-- Then, in order and only if not empty: Bugs, Rule breaks, Fit the moment, Streamline, Phone, Gaps. Gaps cite the open ticket in "Breaks" (#443) or say "Question" when no rule covers it. -->
</main>
<script src="../assets/nav.js"></script>
<script src="../assets/editor.js"></script>
</body>
```
