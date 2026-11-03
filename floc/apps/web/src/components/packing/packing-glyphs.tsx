/** The button shapes both packing rows share (tickets 219, 220); their marks come from `system/icons`. */

// `!` throughout to beat buttonBase's pill padding — Tailwind v4 specificity is
// stylesheet order, not class-list order (same trick as `menuItemClass`).
// No lift, either: these re-render under the cursor the moment they're
// clicked, and the hover transform replaying on the fresh element reads as the
// button bouncing (ticket 219). Colour still moves.
export const squareButton =
  "!size-6 !shrink-0 !p-0 !transition-colors hover:!translate-y-0 hover:!shadow-none sm:!size-7";

/** The tick box, styled by whether it's ticked. A plain button, deliberately. */
export const tickBoxClass = (packed: boolean): string =>
  packed
    ? "border-green/40 bg-green-soft text-green"
    : "border-rule-strong bg-sheet text-ink-faint/60 hover:text-ink-soft";

export const tickBoxBase =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-full border sm:size-7";

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
