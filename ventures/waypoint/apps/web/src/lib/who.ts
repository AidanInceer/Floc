/**
 * Which pastel wash a person's avatar gets (ticket 11). The colour tokens
 * themselves (`--who-1`…`--who-8` and their ink pairs) live in globals.css.
 *
 * Lives in `lib/` rather than next to `Avatar` because `lib/access.ts` stamps
 * every `TripMember` with its tone as it loads the roster — a component
 * importing from `lib/` is the direction we want, not the reverse.
 *
 * paper.html gives each member their own coloured initial disc rather than one
 * accent for everyone: with nine people writing in the same notebook you have
 * to be able to tell handwriting apart at a glance.
 */

const WHO_TONES = 8;

/**
 * Colour by position in a trip's roster — the preferred form. Within one trip
 * nobody shares a colour, and a member looks the same on every tab. Wraps
 * past eight members, so a very large trip does repeat.
 */
export function seatTone(seat: number): string {
  return `who-${(seat % WHO_TONES) + 1}`;
}

/**
 * Colour by hashed display name — the fallback for an avatar with no roster
 * behind it: the signed-in user in the header, a friend, the landing page's
 * mock, a former member on an old expense. Needs no coordination and keeps one
 * person one colour, at the cost of the odd clash. Acceptable, because colour
 * is a recognition aid here and never the only way to tell two people apart —
 * the initials and the `title` still do that.
 */
export function whoTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    // Cheap deterministic string hash (djb2-ish), kept in 32-bit range.
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return `who-${(Math.abs(hash) % WHO_TONES) + 1}`;
}
