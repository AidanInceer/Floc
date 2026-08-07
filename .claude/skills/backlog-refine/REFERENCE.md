# backlog-refine — Reference

## Reading current GitHub issues

```bash
gh issue list --repo AidanInceer/Waypoint --state open \
  --json number,title,labels,body --limit 50
```

---

## HTML link format for ticketed backlog items

Each bullet that has been ticketed must carry hyperlinks to its GitHub issue(s):

```html
<li>
  Trip export feature
  <a href="https://github.com/AidanInceer/Waypoint/issues/42">#42</a>
  <!-- sub-tickets if any: -->
  <a href="https://github.com/AidanInceer/Waypoint/issues/43">#43</a>
  <a href="https://github.com/AidanInceer/Waypoint/issues/44">#44</a>
</li>
```

- Use full GitHub URLs so they work when opened locally via `file://`.
- List the parent issue first, then any sub-tickets in creation order.

---

## Dropping a feature

1. Find all `<li>` entries in `docs/backlog/*.html` related to the feature — check all pages.
2. Extract every linked issue number from the `<a href>` annotations on those bullets.
3. Also check for any un-annotated issues by searching titles:
   ```bash
   gh issue list --repo AidanInceer/Waypoint --state open --search "<feature keyword>"
   ```
4. **Confirm with the user** if there are more than 2 issues to close — list them first.
5. Close in dependency order (children before parent):
   ```bash
   gh issue close <n> --repo AidanInceer/Waypoint \
     --comment "Dropped: <reason the user gave>."
   ```
6. Remove the bullet(s) and all their `<a href>` annotations from the HTML.

---

## Grill questions for vague backlog items

When invoking `grill-me`, seed it with these angles:
- What problem does this solve for the user?
- Who is the user and what's their context?
- What does "done" look like — what can the user do that they couldn't before?
- What's explicitly out of scope?
- Any hard constraints (performance, platform, cost)?
