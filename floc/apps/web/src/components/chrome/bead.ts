// One of the top bar's beads: wordmark, places, you. A hairline ring, not a border, so it adds no size.
export const BEAD =
  "fuse-bead flex h-11 items-center rounded-md bg-sheet p-1 shadow-[inset_0_0_0_1px_var(--rule),var(--shadow-sm)]";

// Why: the items inside a bead sit 8px apart, so a folded bar spaces every glyph alike, inside a bead and across a join.
export const BEAD_ITEMS = "gap-2";

export const BEAD_ITEM =
  "group flex h-full shrink-0 items-center rounded-sm px-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink aria-[current=page]:text-ink sm:gap-1.5";

// A count on a glyph's tile — invites on Trips, news in the inbox — so it never widens the bar.
export const BEAD_COUNT =
  "absolute -right-2 -top-1.5 min-w-4 rounded-full border-2 border-sheet bg-pen px-1 text-center font-mono text-[11px] font-semibold leading-[13px] text-sheet";

// The glyph's tile: the one thing in the bar that shows hover, open and here.
export const BEAD_TILE =
  "inline-flex size-[26px] items-center justify-center rounded-sm text-ink-faint transition-colors group-hover:bg-pen-soft group-hover:text-pen-deep group-aria-[current=page]:bg-pen-soft group-aria-[current=page]:text-pen-deep group-data-[open=true]:bg-pen-soft group-data-[open=true]:text-pen-deep";

// Why: the inbox and your card hang from the right edge of the bead that is you, a gap below it; below sm they span the screen.
export const BEAD_PANEL =
  "top-full mt-3 overflow-hidden rounded-md bg-sheet shadow-[inset_0_0_0_1px_var(--rule),var(--shadow-lift)] max-sm:fixed max-sm:left-2 max-sm:right-2 max-sm:top-[68px] max-sm:mt-0 max-sm:w-auto";
