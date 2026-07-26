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
 * Ruled lines rather than the usual grey skeleton bars: an empty page of the
 * notebook is the honest thing to show while the entry is being written.
 */
import { Page } from "@/components/ui";

export default function TripTabLoading() {
  return (
    <Page wide flush>
      <div aria-busy="true" aria-live="polite" className="py-2">
        <span className="typed">Turning the page…</span>
        <div className="mt-6 space-y-7" aria-hidden>
          {[26, 20, 23, 14, 18].map((width, i) => (
            <div
              key={i}
              className="h-3 rounded-sm bg-sheet-3 opacity-70"
              style={{ width: `${width}ch` }}
            />
          ))}
        </div>
      </div>
    </Page>
  );
}
