/**
 * How long a piece of user-supplied text may be (ticket 113).
 *
 * Before this, exactly one column had a cap — `note.body` at 2000 — and every
 * other free-text field took whatever was posted. A `maxlength` on the input is
 * a courtesy to somebody typing, not a limit: the action is reachable without
 * the form. One multi-megabyte idea is a cheap way to make a trip page unusable
 * for the whole group, and nothing stopped it.
 *
 * **Truncate, don't reject.** A cap here is a storage bound, not a rule the
 * group agreed to, so silently keeping the first N characters is friendlier
 * than throwing away a long paragraph with an error — and it matches what
 * `note.body` already did. The two exceptions are `tripName`, which is short
 * enough that a truncation would be visibly wrong, and any field whose emptiness
 * is itself an error; those return a form error and say so at the call site.
 *
 * Pure, so it lives in `lib/` and the caps are readable from a Client Component
 * — the `maxlength` attributes should be generated from these, not retyped.
 */

export const TEXT_CAPS = {
  /** A trip's name. Rejected rather than truncated — see `renameTrip`. */
  tripName: 120,
  /** One idea on the board. Long enough for a paragraph of reasoning. */
  ideaNote: 2000,
  /** A comment or reply. The one cap that predates this module. */
  noteBody: 2000,
  /** An expense's one-line description. */
  expenseDescription: 200,
  /** The longer free-text note on an expense. */
  expenseNotes: 2000,
  /** The optional line attached to a nudge. */
  nudgeMessage: 500,
  /** A person's chosen display name. */
  displayName: 80,
  /** A profile's avatar URL. */
  avatarUrl: 500,
  /** A place's name, whether geocoded or typed by hand. */
  placeName: 200,
  /** A day event's title. */
  eventTitle: 200,
  /** A day event's own detail note. */
  eventNote: 2000,
  /** What a trip link is called. A line, not a description. */
  linkLabel: 120,
} as const;

export type TextCap = keyof typeof TEXT_CAPS;

/**
 * Trims and truncates to a named cap. Returns `null` for an empty result, which
 * is what every nullable text column wants — an empty string and "not set" are
 * the same thing in all of them, and storing `""` makes them differ.
 */
export function capText(value: unknown, cap: TextCap): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TEXT_CAPS[cap]);
}

/** The same, for a column that must not be null — an empty string stays empty. */
export function capRequiredText(value: unknown, cap: TextCap): string {
  return String(value ?? "").trim().slice(0, TEXT_CAPS[cap]);
}
