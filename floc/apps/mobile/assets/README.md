# Icons

`icon.png`, `adaptive-icon.png` and `splash.png` are **generated**, not drawn.
Do not edit them by hand — rerun the generator instead:

```
node scripts/make-icons.mjs
```

It draws the wordmark's three chevrons (`--pen` on `--paper`) at the sizes each
store wants, so the app icon cannot drift from `wordmark.tsx` on the web. Change
the mark there, change `CHEVRONS` here, rerun.

`adaptive-icon.png` is transparent on purpose: Android masks it and paints the
background from `app.json`.

The rest of the store submission list is in [`../STORE.md`](../STORE.md).
