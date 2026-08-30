/**
 * Length caps for user-supplied text (ticket 113). `maxlength` on an input is
 * a courtesy, not a limit — the action is reachable without the form, so caps
 * are enforced here too. Truncate, don't reject: a cap is a storage bound, not
 * a rule the group agreed to. Exceptions are `tripName` (truncation would be
 * visibly wrong) and any field whose emptiness is itself an error — those
 * return a form error at the call site instead.
 */

export const TEXT_CAPS = {
  /** Rejected rather than truncated — see `renameTrip`. */
  tripName: 120,
  ideaNote: 2000,
  noteBody: 2000,
  /** The whole Notes doc as JSON (ticket 238). Rejected, never truncated — half a JSON blob is not a document. */
  noteDoc: 400_000,
  expenseDescription: 200,
  expenseNotes: 2000,
  nudgeMessage: 500,
  displayName: 80,
  avatarUrl: 500,
  placeName: 200,
  eventTitle: 200,
  eventNote: 2000,
  linkLabel: 120,
  packingLabel: 200,
  /** A file's own name (ticket 239) — it rides in a response header twice. */
  documentName: 200,
  packingKitName: 80,
} as const;

export type TextCap = keyof typeof TEXT_CAPS;

/** Trims and truncates to a named cap. `null` for empty — keeps "" and "not set" the same. */
export function capText(value: unknown, cap: TextCap): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TEXT_CAPS[cap]);
}

/** The same, for a column that must not be null — an empty string stays empty. */
export function capRequiredText(value: unknown, cap: TextCap): string {
  return String(value ?? "").trim().slice(0, TEXT_CAPS[cap]);
}
