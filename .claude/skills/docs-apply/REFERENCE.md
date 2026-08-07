# docs-apply — Reference

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

<script src="../assets/vendor/mermaid.min.js"></script>
<script src="../assets/diagrams.js"></script>
<!-- only include the above two scripts if the page has mermaid diagrams -->
```

**Rules:**
- Plain `<script src>` only — no `fetch`, no ES modules (site runs on `file://` origin).
- Diagrams: `<pre class="mermaid">` blocks. Load `mermaid.min.js` before `diagrams.js`, always in that order.
- New pages go in a topic subfolder (`design/`, `backlog/`, `research/`, etc.) — never at the root except `index.html`.
- Adding a new page requires a matching entry in `docs/assets/nav.js` TREE array.

### nav.js TREE entry shape

```js
{ id: 'my-page', label: 'My page', href: 'topic/my-page.html' }

// or nested under a group:
{ label: 'Group name', children: [
  { id: 'my-page', label: 'My page', href: 'topic/my-page.html' }
]}
```

---

## GitHub issue commands

### Create a new issue

```bash
gh issue create \
  --repo AidanInceer/Waypoint \
  --title "<title>" \
  --body "$(cat <<'EOF'
<body markdown>
EOF
)"
```

### Add a comment to an existing issue

```bash
gh issue comment <n> \
  --repo AidanInceer/Waypoint \
  --body "<comment>"
```

### Replace an issue body (only when explicitly requested)

```bash
gh issue edit <n> \
  --repo AidanInceer/Waypoint \
  --body "<new body>"
```
