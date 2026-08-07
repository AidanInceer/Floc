# docs-refine — Reference

## Refined doc template

Write this to `docs/input/refined/<filename>.md`:

```markdown
# Refined: <original filename>
_Source: docs/input/raw/<filename>.md_
_Refined: <today's date>_

## Doc updates

### <target file path, or "New page: <topic>">
<Plain-language description of the change — what section, what to add/change/remove.
Quote key phrases from the raw notes where helpful.>

## Backlog updates

### New issue: <proposed title>
**Body:**
<Proposed issue body — what, why, acceptance criteria if clear.>

### Update issue #<n>: <title>
<What to add or change in that issue.>

## Out of scope
<Items the raw notes mention that are outside docs/backlog — code changes, design work, etc.
Note them here for awareness; they are not actioned by docs-apply.>
```

- If there are no doc updates, write `_None._` under that section.
- If there are no backlog updates, write `_None._` under that section.
- Omit `## Out of scope` entirely if there is nothing to flag.
- One `###` entry per discrete change or issue action — don't bundle unrelated changes.

---

## Backlog file

There is one backlog file: `docs/backlog/backlog.html`.

It has three sections:
- **Near-term** — bugs and polish (bulleted, not yet GitHub issues unless annotated with a link)
- **Free track** — prioritised ideas table
- **Paid track** — AI/automation/premium ideas table
- **Contested** — ideas that conflict with the "what not to build" boundary

When notes add new ideas, place them in the appropriate section. When notes add near-term bugs/polish, add a `<li>` to the Near-term list. Annotate ticketed items with `<a href="https://github.com/AidanInceer/Waypoint/issues/<n>">#n</a>`.

---

## Reference docs under backlog

Supporting research (competitor analysis, market research, etc.) belongs in topic subfolders under `docs/`, not in `docs/backlog/` itself. Example structure:

```
docs/competitors/competitor-summary.html
docs/competitors/competitor-polarsteps.html
docs/research/partner-trips.html
```

When adding a new reference page:
1. Create it in the appropriate topic subfolder (e.g. `docs/competitors/`, `docs/research/`).
2. Add a TREE entry in `docs/assets/nav.js` under the matching group.
3. Use `data-root=".."` and `data-page="<id>"` on `<body>`.

---

## HTML page conventions

Every doc page follows this shell:

```html
<link rel="stylesheet" href="../assets/docs.css">
<!-- adjust ../ depth to match the page's folder level -->

<body data-root=".." data-page="<id>">
<!-- data-root: relative path back to docs/ root -->
<!-- data-page: must match an id in the TREE array in docs/assets/nav.js -->

<nav id="sidebar"></nav>

<main>
  <!-- page content here -->
</main>

<script src="../assets/nav.js"></script>

<!-- Only include the following two scripts if the page has mermaid diagrams: -->
<script src="../assets/vendor/mermaid.min.js"></script>
<script src="../assets/diagrams.js"></script>
```

**Rules:**
- Plain `<script src>` only — no `fetch`, no ES modules (site runs on `file://` origin).
- Diagrams: `<pre class="mermaid">` blocks. Load `mermaid.min.js` before `diagrams.js`.
- New pages go in a topic subfolder — never at the root except `index.html`.
- Adding a new page requires a matching entry in `docs/assets/nav.js` TREE array.

### nav.js TREE entry shape

```js
{ id: 'my-page', label: 'My page', href: 'topic/my-page.html' }

// or nested under a group:
{ label: 'Group name', children: [
  { id: 'my-page', label: 'My page', href: 'topic/my-page.html' }
]}
```
