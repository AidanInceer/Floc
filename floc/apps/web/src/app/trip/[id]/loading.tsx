/**
 * The fallback shown while a tab's own content loads. Scoped to the tab body
 * only — the trip header and the tab bar live in `layout.tsx`, so they stay
 * put and the clicked tab stays highlighted while this swaps in underneath.
 *
 * Two reasons this exists rather than letting the page block:
 *  - Every tab is a server render over the database, so there is always a
 *    real wait. Without a boundary the whole trip screen (header included)
 *    freezes on the old tab, and the click reads as having been ignored.
 *  - It gives Next.js a prefetchable boundary for these dynamic routes, so a
 *    hovered tab has something ready before it is clicked.
 *
 * It holds the shape every tab arrives in (ticket 202) — a heading, a row of
 * tiles, then a body — so the page settles into the skeleton instead of
 * jumping past it.
 */
export default function TripTabLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6"
    >
      <span className="typed">Loading…</span>
      <div className="mt-4 flex flex-col gap-4" aria-hidden>
        <div className="h-9 w-[18ch] rounded-md bg-sheet-3 opacity-70" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-sheet opacity-80" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)]">
          <div className="h-64 rounded-lg bg-sheet opacity-80" />
          <div className="h-64 rounded-lg bg-sheet opacity-80" />
        </div>
      </div>
    </div>
  );
}
