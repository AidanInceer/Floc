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
  "!size-6 !shrink-0 !p-0 !transition-colors hover:!translate-y-0 hover:!shadow-none sm:!size-7";

/** The tick box, styled by whether it's ticked. A plain button, deliberately — see `PackingLineRow`. */
export const tickBoxClass = (packed: boolean): string =>
  packed
    ? "border-green/40 bg-green-soft text-green"
    : "border-rule-strong bg-sheet text-ink-faint/60 hover:text-ink-soft";

export const tickBoxBase =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-full border sm:size-7";

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

/**
 * The select box on a row (ticket 229). A real checkbox, associated to the bulk
 * form by id rather than nesting inside it — a row already carries its own
 * forms, and HTML has no nested forms. `accent-pen` keeps it on the one blue
 * instead of the browser's.
 */
export function SelectLineBox({
  formId,
  lineId,
  label,
}: {
  /** Null while the list is in its normal reading mode — no box at all. */
  formId: string | null;
  lineId: number;
  label: string;
}) {
  if (!formId) return null;
  return (
    <input
      type="checkbox"
      form={formId}
      name="lineId"
      value={lineId}
      aria-label={`Select ${label}`}
      className="size-4 shrink-0 accent-pen"
    />
  );
}

/** Bars shortening down the stack — the same "ordered" mark the trips page uses. */
export function SortGlyph() {
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
      <path d="M2.5 3.5h9M2.5 7h6M2.5 10.5h3" />
    </svg>
  );
}

/** A funnel — empty when nothing is filtered out. */
export function FilterGlyph() {
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
      <path d="M2.2 3h9.6L8.2 7.3v4L5.8 12V7.3z" />
    </svg>
  );
}

/** The twisty on a collapsible section — points right when shut, down when open. */
export function DisclosureGlyph() {
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
      <path d="M5.2 3.2 L9.2 7 L5.2 10.8" />
    </svg>
  );
}
