# UI prototype

Several **structurally different** answers to one "what should this look like?" question, on one static page in `floc/wireframe/<folder>/`, switched by `?variant=`. Never an app route ([SKILL.md](SKILL.md#in-floc)). For logic or state, use [LOGIC.md](LOGIC.md).

1. **State the question and pick N.** The number asked for, else 3. Past 6 they stop differing and become noise. Later rounds add variants to the same page ([Rounds](SKILL.md#rounds)).
2. **Draw the chrome around it.** The header, the trip tab bar and a real-looking trip (`/_house/kit/trip-frame.mjs`), so no variant is judged in a vacuum.
3. **Make them disagree about structure** — layout, hierarchy, primary control. Not colour or copy. If two come out alike, redo one with "not a card grid" as the brief.
4. **Wire them with the house switcher** (`/_house/switcher.js`): one list, one render function. The panel on the right lists every variant by round, and the pick in `wf-status` marks one.
5. **Hand it over** with the URL and its `?variant=` keys, plus screenshots (`pnpm wireframe:shoot`). The useful feedback is usually "the header from B with the list from C".

## Anti-patterns

- **Shared layout between variants.** A shared header is fine; a shared layout defeats the point.
- **Real mutations.** State lives in memory; a reload starts over.
- **Copying the prototype into the app.** `/floc:implement-feature` rebuilds the pick test-first.
