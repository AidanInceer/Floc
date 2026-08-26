/**
 * The two marks and the one button shape both packing rows share (tickets 219,
 * 220). Hand-drawn line art on a 14×14 box like every other icon here — no
 * icon font, no emoji.
 */

// `!` throughout to beat buttonBase's pill padding — Tailwind v4 specificity is
// stylesheet order, not class-list order (same trick as `menuItemClass`).
// No lift, either: these re-render under the cursor the moment they're
// clicked, and the hover transform replaying on the fresh element reads as the
// button bouncing (ticket 219). Colour still moves.
export const squareButton =
  "!size-7 !shrink-0 !p-0 !transition-colors hover:!translate-y-0 hover:!shadow-none";

/** The tick box, styled by whether it's ticked. A plain button, deliberately — see `PackingLineRow`. */
export const tickBoxClass = (packed: boolean): string =>
  packed
    ? "border-green/40 bg-green-soft text-green"
    : "border-rule-strong bg-sheet text-ink-faint/60 hover:text-ink-soft";

export const tickBoxBase =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full border";

export function CheckGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
    </svg>
  );
}

export function CrossGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5" />
    </svg>
  );
}

export function MinusGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3.5 7h7" />
    </svg>
  );
}

export function PlusGlyph() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3.5 7h7M7 3.5v7" />
    </svg>
  );
}
