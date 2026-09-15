---
name: review-docs
description: Act on the marks a person left in the local docs editor — delete red highlights, tighten yellow ones, resolve comments, and repair markup the editor broke. Use when the user says /floc:review-docs, "review the docs", or "go through my doc comments".
---

# review-docs

Touch only what is marked or broken. Every other word stays.

## 1. Read the marks

Marks are not in the HTML. `docs/assets/editor.js` keeps them in the browser's
`localStorage`, key `floc-doc-annotations:<page>`, per page:
`{ annotations: [{ block, start, end, type, value, colour }], content }`.
`block` is `data-doc-block` or `auto-<n>` (index over
`main h1,h2,h3,h4,p,li,td,blockquote,pre`). `start`/`end` are text offsets in that block.

Read them from the browser the user edits in (Claude in Chrome, `http://localhost:4173`,
the `pnpm docs:dev` server). One `javascript_tool` call dumps every key:

```js
Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('floc-doc-annotations:')).map(k => [k, JSON.parse(localStorage[k])]))
```

For each annotation, resolve the marked text on that page before editing. No marks and no user-named page → say so and stop.

## 2. Edit the HTML in `docs/`

| Mark | Do |
|---|---|
| Red `#f5b7a5` | Delete the marked text. Empty element left → delete the element. |
| Yellow `#ffe58a` | Reword shorter and clearer. Same meaning, [CLAUDE.md](../../../../CLAUDE.md) voice. |
| Comment | Do what it asks. Unclear or out of scope → leave it, list it in the report. |
| Green, blue, bold, underline | Leave. |

## 3. Fix what the editor broke

The editor saves the live DOM back to disk. Repair only these, on pages it saved:

- `<div>`/`<br>`/`&nbsp;` inserted by typing inside a block; text split across siblings.
- Leftover `contenteditable`, `doc-content-editing`, `data-doc-block="auto-…"`, `data-doc-annotation`, inline `style` from the editor.
- Emptied `#sidebar`, duplicated `<!doctype html>`, lost indentation on changed lines.

Compare with `docs/` structure elsewhere to see what the page should look like. Do not reformat untouched lines.

## 4. Clear and report

Run `pnpm docs:check`. Then remove the handled annotations from `localStorage`
(keep unresolved comments), and reload the page.

Report: page → deleted / reworded / comments done / comments left / markup fixed. Nothing else.
